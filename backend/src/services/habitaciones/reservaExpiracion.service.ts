import { QueryTypes } from "sequelize";
import { env } from "../../config/env";
import { logger } from "../../utils/logger";
import { removeCancelledRoomReservationFromActiveCarts } from "../carrito/carritoItem.service";
import { decideExpiration, hasExpirationColumn, isExpirationPolicyEnabled, type PaymentSnapshot } from "./reservaExpiracion.policy";

const { sequelize } = require("../../models");

/** Clave del advisory lock: una sola ejecución a la vez entre todos los procesos del backend. */
const ADVISORY_LOCK_KEY = 7_204_001;

export interface ExpirationReport {
  habilitada: boolean;
  dry_run: boolean;
  omitida?: "politica_desactivada" | "columna_expira_en_ausente" | "otra_ejecucion_en_curso";
  elegibles: number;
  expiradas: number[];
  omitidas: Array<{ reserva_id: number; motivo: string }>;
  pagos_conciliados: number[];
  errores: Array<{ reserva_id: number; error: string }>;
}

type Outcome =
  | { resultado: "expirada" | "elegible" }
  | { resultado: "omitida"; motivo: string }
  | { resultado: "conciliar"; pagos: number[] };

/**
 * Evalúa y, si corresponde, expira UNA reserva en una transacción propia.
 * Orden de bloqueos idéntico al de createPago: Carrito -> ReservaHabitacion -> Pago.
 * Con el bloqueo de la reserva, createPago y la confirmación por webhook se serializan con esta tarea:
 * o bien el pago ya existe (y esta tarea lo ve y no libera), o bien la reserva queda expirada y createPago la rechaza.
 */
const evaluateOne = async (reservationId: number, dryRun: boolean, now: Date): Promise<Outcome> =>
  sequelize.transaction(async (transaction: unknown) => {
    const q = (sql: string, replacements: Record<string, unknown>) =>
      sequelize.query(sql, { replacements, type: QueryTypes.SELECT, transaction }) as Promise<Array<Record<string, any>>>;
    const cartRows = await q(
      `SELECT DISTINCT carrito_id FROM carrito_items WHERE tipo_item = 'habitacion' AND referencia_id = :id ORDER BY carrito_id`,
      { id: reservationId },
    );
    const cartIds = cartRows.map(row => Number(row.carrito_id));
    const carts = cartIds.length
      ? await q(`SELECT id, estado, expira_en FROM carritos WHERE id IN (:ids) ORDER BY id FOR UPDATE`, { ids: cartIds })
      : [];
    const [reservation] = await q(
      `SELECT id, estado, expira_en FROM reservas_habitacion WHERE id = :id FOR UPDATE`,
      { id: reservationId },
    );
    if (!reservation || reservation.estado !== "pendiente" || !reservation.expira_en || new Date(reservation.expira_en) > now) {
      return { resultado: "omitida", motivo: "ya_no_elegible" } as const;
    }
    const currentLinks = await q(
      `SELECT DISTINCT carrito_id FROM carrito_items WHERE tipo_item = 'habitacion' AND referencia_id = :id`,
      { id: reservationId },
    );
    const paymentCartIds = currentLinks.map(row => Number(row.carrito_id));
    const payments = await q(
      paymentCartIds.length
        ? `SELECT id, estado, metodo, id_transaccion_externo, "updatedAt", carrito_id FROM pagos
            WHERE reserva_habitacion_id = :id OR carrito_id IN (:ids) ORDER BY id FOR UPDATE`
        : `SELECT id, estado, metodo, id_transaccion_externo, "updatedAt", carrito_id FROM pagos
            WHERE reserva_habitacion_id = :id ORDER BY id FOR UPDATE`,
      { id: reservationId, ids: paymentCartIds },
    );
    const cartExpired = new Map<number, boolean>(carts.map(cart => [
      Number(cart.id),
      ["expirado", "cancelado"].includes(String(cart.estado)) || Boolean(cart.expira_en && new Date(cart.expira_en) <= now),
    ]));
    const snapshots: PaymentSnapshot[] = payments.map(p => ({
      id: Number(p.id), estado: String(p.estado), metodo: String(p.metodo),
      id_transaccion_externo: p.id_transaccion_externo ?? null, updatedAt: p.updatedAt,
      // Un pago directo a la reserva (sin carrito) no tiene carrito que esperar.
      carrito_expirado: p.carrito_id == null ? true : cartExpired.get(Number(p.carrito_id)) ?? true,
    }));
    const decision = decideExpiration(snapshots, env.RESERVA_EXPIRACION_GRACIA_PAGO_MINUTOS, now);
    if (decision.accion === "omitir") return { resultado: "omitida", motivo: decision.motivo } as const;
    if (decision.accion === "conciliar") return { resultado: "conciliar", pagos: decision.pagos } as const;
    if (dryRun) return { resultado: "elegible" } as const;
    await sequelize.query(
      `UPDATE reservas_habitacion SET estado = 'expirada', "updatedAt" = :now WHERE id = :id AND estado = 'pendiente'`,
      { replacements: { id: reservationId, now }, transaction },
    );
    return { resultado: "expirada" } as const;
  });

/**
 * Expira las reservas de habitación pendientes cuyo plazo venció. Idempotente y segura frente a ejecuciones concurrentes.
 * Con dryRun solo informa. No hace nada si la política está desactivada o falta la columna expira_en.
 */
export const expirePendingRoomReservations = async (options: { dryRun?: boolean; now?: Date } = {}): Promise<ExpirationReport> => {
  const dryRun = options.dryRun === true;
  const now = options.now ?? new Date();
  const report: ExpirationReport = { habilitada: isExpirationPolicyEnabled(), dry_run: dryRun, elegibles: 0, expiradas: [], omitidas: [], pagos_conciliados: [], errores: [] };
  if (!report.habilitada && !dryRun) return { ...report, omitida: "politica_desactivada" };
  if (!(await hasExpirationColumn())) return { ...report, omitida: "columna_expira_en_ausente" };

  // Transacción solo para sostener el advisory lock mientras dura la ejecución.
  return sequelize.transaction(async (lockTx: unknown) => {
    const [lock] = await sequelize.query("SELECT pg_try_advisory_xact_lock(:key) AS got", { replacements: { key: ADVISORY_LOCK_KEY }, type: QueryTypes.SELECT, transaction: lockTx }) as Array<{ got: boolean }>;
    if (!lock?.got) return { ...report, omitida: "otra_ejecucion_en_curso" };
    const candidates = await sequelize.query(
      `SELECT id FROM reservas_habitacion WHERE estado = 'pendiente' AND expira_en IS NOT NULL AND expira_en <= :now ORDER BY expira_en LIMIT :limit`,
      { replacements: { now, limit: env.RESERVA_EXPIRACION_LOTE }, type: QueryTypes.SELECT },
    ) as Array<{ id: number }>;
    report.elegibles = candidates.length;
    for (const { id } of candidates) {
      try {
        const outcome = await evaluateOne(id, dryRun, now);
        if (outcome.resultado === "conciliar") {
          // El planificador no crea ni cancela intentos. Sin coordinación duradera
          // con checkout, el vencimiento no prueba que ya no pueda haber un cobro.
          report.omitidas.push({ reserva_id: id, motivo: "requiere_verificacion_de_pago" });
          continue;
        }
        if (outcome.resultado === "expirada") {
          report.expiradas.push(id);
          // Limpieza posterior y recuperable: una reserva vencida no debe dejar bloqueado el carrito del cliente.
          // No amplía ni modifica otros artículos; si falla, el pago de la reserva vencida sigue rechazado por el servidor.
          try {
            const [owner] = await sequelize.query("SELECT usuario_id FROM reservas_habitacion WHERE id = :id", { replacements: { id }, type: QueryTypes.SELECT }) as Array<{ usuario_id: number }>;
            // Una reserva presencial (huésped sin cuenta) no tiene carrito que limpiar.
            if (owner?.usuario_id != null) await removeCancelledRoomReservationFromActiveCarts(id, Number(owner.usuario_id));
          } catch { /* se reintenta si el cliente vuelve a abrir el carrito o la cancela */ }
        }
        else if (outcome.resultado === "omitida") report.omitidas.push({ reserva_id: id, motivo: outcome.motivo });
      } catch (error) {
        report.errores.push({ reserva_id: id, error: error instanceof Error ? error.message.slice(0, 160) : "error" });
      }
    }
    return report;
  });
};

let running = false;
let timer: NodeJS.Timeout | undefined;
/**
 * Dispara periódicamente la expiración. El temporizador solo "despierta" el proceso: la corrección no depende de él,
 * porque el vencimiento vive en la base de datos y el advisory lock evita ejecuciones simultáneas.
 */
export const startReservationExpirationScheduler = async () => {
  if (!isExpirationPolicyEnabled()) return false;
  if (!(await hasExpirationColumn())) {
    logger.warn("reserva_expiracion.inactiva", { motivo: "falta la columna expira_en (migración pendiente)" });
    return false;
  }
  timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const report = await expirePendingRoomReservations();
      if (report.expiradas.length || report.errores.length || report.pagos_conciliados.length) {
        logger.info("reserva_expiracion.ejecucion", { expiradas: report.expiradas, conciliados: report.pagos_conciliados, omitidas: report.omitidas.length, errores: report.errores.length });
      }
    } catch (error) {
      logger.error("reserva_expiracion.fallo", { error: error instanceof Error ? error.message : String(error) });
    } finally { running = false; }
  }, env.RESERVA_EXPIRACION_INTERVALO_SEGUNDOS * 1000);
  timer.unref();
  logger.info("reserva_expiracion.activa", { intervalo_s: env.RESERVA_EXPIRACION_INTERVALO_SEGUNDOS, ttl_min: env.RESERVA_PENDIENTE_TTL_MINUTOS });
  return true;
};
export const stopReservationExpirationScheduler = () => { if (timer) clearInterval(timer); timer = undefined; };
