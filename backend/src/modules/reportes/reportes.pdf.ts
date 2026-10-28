import PDFDocument from "pdfkit";
import { OperationalReport, RoomReportRow, RoomReservationsReport } from "./reportes.types";

const money = (value: number) => `Q${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (value: string) => value.split("-").reverse().join("/");
const generated = (value: string) => new Intl.DateTimeFormat("es-GT", { timeZone: "America/Guatemala", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function renderRoomReportPdf(report: RoomReservationsReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36, bufferPages: true,
      info: { Title: "Reservas de habitaciones por sede y período", Author: "HOTEL HUNAHPÚ" } });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    const width = doc.page.width - 72;
    const columnDefinitions = [
      { label: "Reserva", width: 42 }, { label: "Sede", width: 105 }, { label: "Hab.", width: 45 },
      { label: "Tipo de habitación", width: 102 }, { label: "Entrada", width: 65 }, { label: "Salida", width: 65 },
      { label: "Estado", width: 70 }, { label: "Huéspedes", width: 52 }, { label: "Noches en período", width: 54 },
      { label: "Importe reservado", width: 80 },
    ];
    const totalWidth = columnDefinitions.reduce((sum, column) => sum + column.width, 0);
    const columns = columnDefinitions.map(column => ({ ...column, width: column.width * width / totalWidth }));
    let y = 0;
    const header = (first: boolean) => {
      doc.font("Helvetica-Bold").fontSize(16).fillColor("#765436").text("HOTEL HUNAHPÚ", 36, 30);
      doc.fontSize(13).fillColor("#242424").text("Reservas de habitaciones por sede y período", 36, 54);
      doc.font("Helvetica").fontSize(9).text(`Sede: ${report.sede}`, 36, 76, { width });
      doc.text(`Período: ${date(report.filtros.desde)} al ${date(report.filtros.hasta)} (ambas fechas incluidas) | Estado: ${report.filtros.estado ?? "Todos"}`);
      doc.text(`Generado: ${generated(report.generado)} (Guatemala) | Moneda: GTQ`);
      if (first) {
        doc.moveDown(0.6).font("Helvetica-Bold").text(`Reservas: ${report.resumen.reservas}   |   Huéspedes por reserva: ${report.resumen.huespedes}   |   Noches en período: ${report.resumen.noches_periodo}`);
        doc.text(`Importe reservado: ${money(report.resumen.importe_reservado)}   |   Canceladas: ${report.resumen.canceladas} (${money(report.resumen.importe_cancelado)})`);
        doc.moveDown(0.5).font("Helvetica").fontSize(8).fillColor("#555555").text(report.criterio, { width });
        doc.moveDown(0.3).text(report.nota_importes, { width });
      }
      y = doc.y + 12;
      doc.rect(36, y, width, 32).fill("#765436");
      let x = 36;
      columns.forEach(column => {
        doc.font("Helvetica-Bold").fontSize(8).fillColor("white").text(column.label, x + 4, y + 6, { width: column.width - 8 });
        x += column.width;
      });
      y += 32;
    };
    header(true);
    const values = (row: RoomReportRow) => [String(row.id), row.sede, row.habitacion, row.tipo_habitacion,
      date(row.fecha_entrada), date(row.fecha_salida), row.estado, String(row.huespedes), String(row.noches_periodo), money(row.importe_reservado)];
    report.registros.forEach((row, index) => {
      const cells = values(row);
      doc.font("Helvetica").fontSize(9);
      const height = Math.max(28, ...cells.map((value, i) => doc.heightOfString(value, { width: columns[i].width - 8 }) + 14));
      if (y + height > doc.page.height - 44) { doc.addPage(); header(false); }
      if (index % 2 === 0) doc.rect(36, y, width, height).fill("#F5F2EE");
      let x = 36;
      cells.forEach((value, i) => {
        doc.font("Helvetica").fontSize(9).fillColor("#242424").text(value, x + 4, y + 7, {
          width: columns[i].width - 8, align: i >= 7 ? "right" : "left",
        });
        x += columns[i].width;
      });
      y += height;
    });
    if (!report.registros.length) doc.font("Helvetica").fontSize(11).fillColor("#555555").text("No hay reservas con los filtros seleccionados.", 40, y + 20);
    const range = doc.bufferedPageRange();
    for (let page = range.start; page < range.start + range.count; page++) {
      doc.switchToPage(page);
      // The footer is below the content margin. Temporarily allow text there;
      // otherwise PDFKit's right-aligned text wrapper creates a blank page.
      const bottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.font("Helvetica").fontSize(8).fillColor("#666666").text("Importes reservados; no representan pagos cobrados.", 36, doc.page.height - 26, { lineBreak: false });
      doc.text(`Página ${page + 1} de ${range.count}`, doc.page.width - 136, doc.page.height - 26, { width: 100, align: "right", lineBreak: false });
      doc.page.margins.bottom = bottomMargin;
    }
    doc.end();
  });
}

/** Same PDFKit engine, brand, page geometry and pagination as the room report. */
export function renderOperationalReportPdf(report: OperationalReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36, bufferPages: true,
      info: { Title: report.titulo, Author: "HOTEL HUNAHPÚ" } });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    const width = doc.page.width - 72;
    const weights = report.columnas.map(column => ["sede", "servicio", "salon", "tipo_evento", "terapeuta"].includes(column.clave) ? 1.65 : 1);
    const widths = weights.map(weight => width * weight / weights.reduce((a, b) => a + b, 0));
    let y = 0;
    const header = (first: boolean) => {
      doc.font("Helvetica-Bold").fontSize(16).fillColor("#765436").text("HOTEL HUNAHPÚ", 36, 30);
      doc.fontSize(13).fillColor("#242424").text(report.titulo, 36, 54);
      doc.font("Helvetica").fontSize(9).text(`Sede: ${report.sede}`, 36, 76, { width });
      doc.text(`Período: ${date(report.filtros.desde)} al ${date(report.filtros.hasta)} | Estado: ${report.filtros.estado ?? "Todos"}`);
      doc.text(`Generado: ${generated(report.generado)} (Guatemala)`);
      if (first) {
        doc.moveDown(0.5).font("Helvetica-Bold");
        doc.text(report.metricas.map(metric => `${metric.etiqueta}: ${metric.formato === "importe" ? money(report.resumen[metric.clave]) : report.resumen[metric.clave]}`).join("   |   "), { width });
        doc.moveDown(0.5).font("Helvetica").fontSize(8).fillColor("#555555").text(report.criterio, { width });
        doc.moveDown(0.3).text(report.nota, { width });
      }
      y = doc.y + 12;
      doc.font("Helvetica-Bold").fontSize(8);
      const height = Math.max(34, ...report.columnas.map((column, i) => doc.heightOfString(column.etiqueta, { width: widths[i] - 8 }) + 12));
      doc.rect(36, y, width, height).fill("#765436");
      let x = 36;
      report.columnas.forEach((column, i) => { doc.fillColor("white").text(column.etiqueta, x + 4, y + 6, { width: widths[i] - 8 }); x += widths[i]; });
      y += height;
    };
    header(true);
    for (const [index, row] of report.registros.entries()) {
      const values = report.columnas.map(column => {
        const value = row[column.clave];
        return value == null ? "—" : column.formato === "importe" ? money(Number(value)) : column.formato === "fecha" ? date(String(value)) : String(value);
      });
      doc.font("Helvetica").fontSize(8);
      const height = Math.max(28, ...values.map((value, i) => doc.heightOfString(value, { width: widths[i] - 8 }) + 14));
      if (y + height > doc.page.height - 44) { doc.addPage(); header(false); }
      if (index % 2 === 0) doc.rect(36, y, width, height).fill("#F5F2EE");
      let x = 36;
      values.forEach((value, i) => { doc.font("Helvetica").fontSize(8).fillColor("#242424").text(value, x + 4, y + 7, { width: widths[i] - 8 }); x += widths[i]; });
      y += height;
    }
    if (!report.registros.length) doc.fontSize(11).fillColor("#555555").text("No hay registros con los filtros seleccionados.", 40, y + 20);
    const range = doc.bufferedPageRange();
    for (let page = range.start; page < range.start + range.count; page++) {
      doc.switchToPage(page);
      const bottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.font("Helvetica").fontSize(8).fillColor("#666666").text("Reporte operativo; no acredita asistencia ni cobros.", 36, doc.page.height - 26, { lineBreak: false });
      doc.text(`Página ${page + 1} de ${range.count}`, doc.page.width - 136, doc.page.height - 26, { width: 100, align: "right", lineBreak: false });
      doc.page.margins.bottom = bottom;
    }
    doc.end();
  });
}
