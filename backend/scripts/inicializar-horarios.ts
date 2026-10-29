/**
 * Inicialización idempotente de horarios operativos (HORARIOS-01/02).
 *
 * Completa SOLO los campos vacíos con horarios iniciales para la presentación
 * (no son horarios comerciales confirmados; se editan después desde el panel):
 *   - Bienestar y spa ............ 09:00–18:00
 *   - Amenidades reservables ..... 08:00–20:00 y 60 min si no tienen duración
 *   - Actividades y experiencias . 08:00–18:00
 *   - Eventos y salones .......... 08:00–22:00
 *
 * Reglas:
 *   - No toca registros con horario ya configurado ni duraciones existentes.
 *   - Un horario parcial (solo apertura o solo cierre) se informa como excepción.
 *   - No marca como reservables las amenidades de libre acceso ni les asigna horario.
 *   - Si la duración del servicio no cabe en el horario inicial, se informa y no se configura.
 *   - No modifica reservas, cupos, tarifas ni modalidades.
 *
 * Uso (requiere las migraciones 20261029010000 y 20261029020000 aplicadas):
 *   npx ts-node scripts/inicializar-horarios.ts            # simulación, no escribe
 *   npx ts-node scripts/inicializar-horarios.ts --apply    # aplica en una transacción
 */
import process from "node:process";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require("../src/models");

const APLICAR = process.argv.includes("--apply");
const DURACION_AMENIDAD = 60;

interface Regla {
  tabla: string;
  modulo: string;
  apertura: string;
  cierre: string;
  /** Duración que debe caber en el horario (minutos) o null si no aplica. */
  duracionSql: string;
  /** Filtro de elegibilidad adicional. */
  elegible: string;
}

const REGLAS: Regla[] = [
  { tabla: "servicios_bienestar", modulo: "Bienestar", apertura: "09:00", cierre: "18:00", duracionSql: "duracion_minutos", elegible: "TRUE" },
  { tabla: "amenidades", modulo: "Amenidades", apertura: "08:00", cierre: "20:00", duracionSql: `COALESCE(duracion_minutos, ${DURACION_AMENIDAD})`, elegible: "reservable = TRUE" },
  { tabla: "recursos_actividad", modulo: "Actividades", apertura: "08:00", cierre: "18:00", duracionSql: "CASE WHEN modalidad = 'experiencia' THEN duracion_minutos ELSE 30 END", elegible: "TRUE" },
  { tabla: "salones", modulo: "Salones", apertura: "08:00", cierre: "22:00", duracionSql: "30", elegible: "TRUE" },
];

const minutos = (hora: string) => Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));

async function main() {
  const { sequelize } = db;
  const resumen: string[] = [];
  const excepciones: string[] = [];

  await sequelize.transaction(async (transaction: any) => {
    const q = (sql: string, replacements: Record<string, unknown> = {}) =>
      sequelize.query(sql, { replacements, transaction, type: sequelize.QueryTypes.SELECT });

    for (const regla of REGLAS) {
      const ventana = minutos(regla.cierre) - minutos(regla.apertura);

      // Excepciones: horario parcial o duración que no cabe en el horario inicial.
      const parciales = await q(
        `SELECT t.id, t.nombre, s.nombre AS sede FROM ${regla.tabla} t LEFT JOIN sucursales s ON s.id = t.sucursal_id
          WHERE ${regla.elegible} AND ((t.hora_apertura IS NULL) <> (t.hora_cierre IS NULL)) ORDER BY t.id`,
      );
      for (const r of parciales as any[]) excepciones.push(`${regla.modulo} #${r.id} ${r.nombre} (${r.sede}): horario parcial; revisar en el panel`);

      const noCaben = await q(
        `SELECT t.id, t.nombre, s.nombre AS sede, ${regla.duracionSql} AS duracion FROM ${regla.tabla} t LEFT JOIN sucursales s ON s.id = t.sucursal_id
          WHERE ${regla.elegible} AND t.hora_apertura IS NULL AND t.hora_cierre IS NULL
            AND (${regla.duracionSql} IS NULL OR ${regla.duracionSql} > :ventana) ORDER BY t.id`,
        { ventana },
      );
      for (const r of noCaben as any[]) excepciones.push(`${regla.modulo} #${r.id} ${r.nombre} (${r.sede}): duración ${r.duracion ?? "sin definir"} min no cabe en ${regla.apertura}–${regla.cierre}`);

      // Registros a completar: elegibles, sin horario y cuya duración cabe.
      const pendientes = await q(
        `SELECT t.id FROM ${regla.tabla} t
          WHERE ${regla.elegible} AND t.hora_apertura IS NULL AND t.hora_cierre IS NULL
            AND ${regla.duracionSql} IS NOT NULL AND ${regla.duracionSql} <= :ventana`,
        { ventana },
      );
      const ids = (pendientes as any[]).map((r) => r.id);

      let duraciones = 0;
      if (regla.tabla === "amenidades") {
        const sinDuracion = await q(
          `SELECT id FROM amenidades WHERE reservable = TRUE AND duracion_minutos IS NULL AND :duracion <= :ventana`,
          { duracion: DURACION_AMENIDAD, ventana },
        );
        duraciones = sinDuracion.length;
        if (APLICAR && duraciones) {
          await sequelize.query(
            `UPDATE amenidades SET duracion_minutos = :duracion, "updatedAt" = NOW() WHERE reservable = TRUE AND duracion_minutos IS NULL`,
            { replacements: { duracion: DURACION_AMENIDAD }, transaction },
          );
        }
      }

      if (APLICAR && ids.length) {
        await sequelize.query(
          `UPDATE ${regla.tabla} SET hora_apertura = :apertura, hora_cierre = :cierre, "updatedAt" = NOW()
            WHERE id IN (:ids) AND hora_apertura IS NULL AND hora_cierre IS NULL`,
          { replacements: { apertura: regla.apertura, cierre: regla.cierre, ids }, transaction },
        );
      }

      const total = await q(`SELECT count(*)::int AS n FROM ${regla.tabla} WHERE ${regla.elegible}`);
      resumen.push(
        `${regla.modulo.padEnd(12)} elegibles: ${String((total as any[])[0].n).padStart(3)} | horario ${regla.apertura}–${regla.cierre} ${APLICAR ? "asignado" : "por asignar"}: ${String(ids.length).padStart(3)}` +
        (regla.tabla === "amenidades" ? ` | duración ${DURACION_AMENIDAD} min ${APLICAR ? "asignada" : "por asignar"}: ${duraciones}` : ""),
      );
    }
  });

  console.log(APLICAR ? "Inicialización APLICADA" : "SIMULACIÓN (sin cambios). Use --apply para aplicar.");
  for (const linea of resumen) console.log("  " + linea);
  console.log(excepciones.length ? "Excepciones:" : "Sin excepciones.");
  for (const e of excepciones) console.log("  - " + e);
  await sequelize.close();
}

main().catch(async (error) => {
  console.error("Error en la inicialización de horarios:", error.message);
  await db.sequelize.close().catch(() => undefined);
  process.exit(1);
});
