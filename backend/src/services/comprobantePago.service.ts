import PDFDocument from "pdfkit";
import { AppError } from "../utils/AppError";
import { Op } from "sequelize";
import { RequesterContext, isPaymentAdministrator } from "../utils/paymentOwnership";
import { getPagoById } from "./pago.service";

const db = require("../models");
const { Carrito, CarritoItem, Pago, ReservaHabitacion, Usuario } = db;

/**
 * Comprobante interno de un pago aprobado.
 *
 * Todo sale de los registros históricos: el importe y la moneda del Pago y el
 * precio/cantidad guardados en carrito_items (o el total guardado de la
 * reserva cuando el pago es directo). No se consultan tarifas actuales ni se
 * calculan impuestos: las facturas internas no están vinculadas a pagos, así
 * que no existe un desglose de impuestos histórico atribuible a este pago.
 */
interface ConceptoComprobante {
  descripcion: string;
  referencia: string | null;
  cantidad: number;
  precio_unitario: number;
  importe: number;
}

export interface ComprobantePago {
  pago_id: number;
  fecha_pago: Date;
  estado: string;
  metodo: string;
  tipo_pago: string;
  moneda: string;
  monto_pagado: number;
  referencia_pasarela: string | null;
  cliente: { nombre: string; email: string };
  conceptos: ConceptoComprobante[];
  total_conceptos: number;
  generado: Date;
}

const ITEM_LABELS: Record<string, string> = {
  habitacion: "Reserva de habitación",
  amenidad: "Reserva de amenidad",
  actividad: "Reserva de actividad",
  mesa: "Reserva de mesa",
  evento: "Reserva de evento",
  bienestar: "Cita de bienestar",
  boleto_parque: "Boleto de parque",
  transporte: "Reserva de transporte",
};

const round = (value: number) => Math.round(value * 100) / 100;

/** Solo los últimos caracteres del identificador de la pasarela. */
const maskReference = (value: string | null) =>
  value ? `…${value.slice(-8)}` : null;

export const getComprobantePago = async (
  id: number,
  requester: RequesterContext
): Promise<ComprobantePago> => {
  // getPagoById verifica existencia y pertenencia (404 si es ajeno; admin explícito permitido).
  const pago = await getPagoById(id, requester);

  if (pago.estado !== "aprobado" || !pago.fecha_pago) {
    throw new AppError(
      409,
      "PAYMENT_RECEIPT_NOT_AVAILABLE",
      "Solo se emite comprobante de pagos aprobados"
    );
  }

  let usuarioId: number | null = null;
  const conceptos: ConceptoComprobante[] = [];

  if (pago.carrito_id != null) {
    const carrito = await Carrito.findByPk(pago.carrito_id);
    usuarioId = carrito?.usuario_id ?? null;
    const items = await CarritoItem.findAll({
      where: { carrito_id: pago.carrito_id },
      order: [["id", "ASC"]],
    });
    for (const item of items) {
      const cantidad = Number(item.cantidad);
      const precio = Number(item.precio);
      conceptos.push({
        descripcion: item.descripcion || ITEM_LABELS[item.tipo_item] || item.tipo_item,
        referencia: `${ITEM_LABELS[item.tipo_item] ?? item.tipo_item} #${item.referencia_id}`,
        cantidad,
        precio_unitario: precio,
        importe: round(precio * cantidad),
      });
    }
  } else if (pago.reserva_habitacion_id != null) {
    const reserva = await ReservaHabitacion.findByPk(pago.reserva_habitacion_id);
    usuarioId = reserva?.usuario_id ?? null;
    if (reserva) {
      const total = Number(reserva.total);
      conceptos.push({
        descripcion: `Reserva de habitación #${reserva.id} (${reserva.fecha_entrada} a ${reserva.fecha_salida})`,
        referencia: `Reserva de habitación #${reserva.id}`,
        cantidad: 1,
        precio_unitario: total,
        importe: total,
      });
    }
  }

  const usuario = usuarioId != null
    ? await Usuario.findByPk(usuarioId, { attributes: ["id", "nombre", "email"] })
    : null;
  if (!usuario || conceptos.length === 0) {
    throw new AppError(
      409,
      "PAYMENT_RECEIPT_INCOMPLETE",
      "El pago no tiene registros de compra suficientes para emitir el comprobante"
    );
  }

  return {
    pago_id: Number(pago.id),
    fecha_pago: pago.fecha_pago,
    estado: pago.estado,
    metodo: pago.metodo,
    tipo_pago: pago.tipo_pago,
    moneda: pago.moneda,
    monto_pagado: Number(pago.monto),
    referencia_pasarela: maskReference(pago.id_transaccion_externo),
    cliente: { nombre: usuario.nombre, email: usuario.email },
    conceptos,
    total_conceptos: round(conceptos.reduce((sum, item) => sum + item.importe, 0)),
    generado: new Date(),
  };
};

/**
 * Pagos aprobados del solicitante que incluyen la reserva indicada, para
 * ofrecer su comprobante desde el detalle de "Mis reservas". Un pago por
 * carrito se vincula por carrito_items (tipo_item + referencia_id); un pago
 * directo de habitación, por reserva_habitacion_id. Nunca devuelve pagos de
 * carritos o reservas de otro usuario (salvo administrador).
 */
export const listComprobantesDeReserva = async (
  tipoItem: string,
  referenciaId: number,
  requester: RequesterContext
) => {
  const admin = isPaymentAdministrator(requester);
  const items = await CarritoItem.findAll({
    where: { tipo_item: tipoItem, referencia_id: referenciaId },
    attributes: ["carrito_id"],
    include: [{
      model: Carrito, attributes: [], required: true,
      ...(admin ? {} : { where: { usuario_id: requester.id } }),
    }],
    raw: true,
  });
  const origins: Record<string, unknown>[] = [];
  if (items.length) origins.push({ carrito_id: { [Op.in]: items.map((item: { carrito_id: number }) => item.carrito_id) } });
  if (tipoItem === "habitacion") {
    const reserva = await ReservaHabitacion.findByPk(referenciaId, { attributes: ["id", "usuario_id"] });
    if (reserva && (admin || reserva.usuario_id === requester.id)) origins.push({ reserva_habitacion_id: reserva.id });
  }
  if (!origins.length) return [];

  const pagos = await Pago.findAll({
    where: { estado: "aprobado", fecha_pago: { [Op.ne]: null }, [Op.or]: origins },
    attributes: ["id", "fecha_pago", "monto", "moneda"],
    order: [["fecha_pago", "DESC"]],
  });
  return pagos.map((pago: any) => ({
    id: Number(pago.id), fecha_pago: pago.fecha_pago, monto: Number(pago.monto), moneda: pago.moneda,
  }));
};

const BRONCE = "#765436";
const CARBON = "#242424";
const CREMA = "#F5F2EE";
const GRIS = "#555555";

const ESTADOS: Record<string, string> = { aprobado: "Aprobado" };
const METODOS: Record<string, string> = { tarjeta: "Tarjeta", transferencia: "Transferencia" };
const TIPOS: Record<string, string> = { total: "Pago total", anticipo: "Anticipo" };

const dateTime = (value: Date) =>
  new Intl.DateTimeFormat("es-GT", {
    timeZone: "America/Guatemala", dateStyle: "long", timeStyle: "short",
  }).format(new Date(value));

export function renderComprobantePdf(data: ComprobantePago): Promise<Buffer> {
  const money = (value: number) =>
    `${data.moneda} ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER", margin: 48,
      info: { Title: `Comprobante interno de pago #${data.pago_id}`, Author: "HOTEL HUNAHPÚ" },
    });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const left = 48;
    const width = doc.page.width - 96;

    // Identidad visual
    doc.font("Helvetica-Bold").fontSize(20).fillColor(BRONCE).text("HOTEL HUNAHPÚ", left, 48);
    doc.font("Helvetica").fontSize(9).fillColor(GRIS).text("Guatemala", left, doc.y);
    doc.moveTo(left, doc.y + 8).lineTo(left + width, doc.y + 8).lineWidth(1).strokeColor(BRONCE).stroke();

    doc.font("Helvetica-Bold").fontSize(14).fillColor(CARBON).text("Comprobante interno de pago", left, doc.y + 20);
    doc.rect(left, doc.y + 6, width, 24).fill(CREMA);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(BRONCE)
      .text("Comprobante interno de pago — No es factura fiscal FEL.", left + 10, doc.y + 13, { width: width - 20 });
    doc.moveDown(1.2);

    const row = (label: string, value: string) => {
      const y = doc.y;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(CARBON).text(label, left, y, { width: 150 });
      doc.font("Helvetica").text(value, left + 155, y, { width: width - 155 });
      doc.moveDown(0.3);
    };
    row("Número de pago:", `#${data.pago_id}`);
    row("Fecha de pago:", `${dateTime(data.fecha_pago)} (Guatemala)`);
    row("Estado:", ESTADOS[data.estado] ?? data.estado);
    row("Método:", METODOS[data.metodo] ?? data.metodo);
    row("Tipo de pago:", TIPOS[data.tipo_pago] ?? data.tipo_pago);
    if (data.referencia_pasarela) row("Referencia de pasarela:", data.referencia_pasarela);
    row("Cliente:", data.cliente.nombre);
    row("Correo:", data.cliente.email);
    row("Moneda:", data.moneda);
    doc.moveDown(0.8);

    // Conceptos
    const cols = [
      { label: "Concepto", width: width * 0.5, align: "left" as const },
      { label: "Cant.", width: width * 0.1, align: "right" as const },
      { label: "Precio unitario", width: width * 0.2, align: "right" as const },
      { label: "Importe", width: width * 0.2, align: "right" as const },
    ];
    let y = doc.y;
    doc.rect(left, y, width, 22).fill(BRONCE);
    let x = left;
    for (const col of cols) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor("white").text(col.label, x + 6, y + 7, { width: col.width - 12, align: col.align });
      x += col.width;
    }
    y += 22;
    data.conceptos.forEach((item, index) => {
      const description = item.referencia ? `${item.descripcion}\n${item.referencia}` : item.descripcion;
      const cells = [description, String(item.cantidad), money(item.precio_unitario), money(item.importe)];
      doc.font("Helvetica").fontSize(9);
      const height = Math.max(24, doc.heightOfString(description, { width: cols[0].width - 12 }) + 12);
      if (y + height > doc.page.height - 120) { doc.addPage(); y = 48; }
      if (index % 2 === 0) doc.rect(left, y, width, height).fill(CREMA);
      x = left;
      cells.forEach((value, i) => {
        doc.font("Helvetica").fontSize(9).fillColor(CARBON).text(value, x + 6, y + 6, { width: cols[i].width - 12, align: cols[i].align });
        x += cols[i].width;
      });
      y += height;
    });

    // Totales
    y += 10;
    const total = (label: string, value: string, bold = false) => {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 11 : 10).fillColor(CARBON)
        .text(label, left, y, { width: width * 0.75, align: "right" })
        .text(value, left + width * 0.75, y, { width: width * 0.25 - 6, align: "right" });
      y += bold ? 18 : 15;
    };
    total("Total de conceptos:", money(data.total_conceptos));
    total("Total pagado:", money(data.monto_pagado), true);

    doc.font("Helvetica").fontSize(8).fillColor(GRIS).text(
      "Desglose de impuestos: no registrado para este pago. Los importes corresponden a los registros guardados " +
      "al momento de la compra y no se recalculan con tarifas actuales.",
      left, y + 10, { width }
    );
    doc.moveDown(0.6).text(
      "Este documento es un comprobante interno emitido por HOTEL HUNAHPÚ como constancia del pago recibido. " +
      "No es una factura electrónica en línea (FEL) ni sustituye documentos tributarios autorizados por la SAT.",
      { width }
    );
    doc.moveDown(0.6).text(`Generado: ${dateTime(data.generado)} (Guatemala)`, { width });

    doc.end();
  });
}
