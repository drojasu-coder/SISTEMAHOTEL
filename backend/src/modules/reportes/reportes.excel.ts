import ExcelJS from "exceljs";
import { OperationalReport, RoomReservationsReport } from "./reportes.types";

const excelDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

export async function renderRoomReportExcel(report: RoomReservationsReport): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HOTEL HUNAHPÚ";
  workbook.created = new Date(report.generado);
  const summary = workbook.addWorksheet("Resumen", { views: [{ showGridLines: false }] });
  summary.getColumn(1).width = 48;
  summary.getColumn(2).width = 95;
  summary.addRows([
    ["HOTEL HUNAHPÚ"], ["Reservas de habitaciones por sede y período"], [report.criterio],
    ["Sede", report.sede], ["Desde (inclusive)", excelDate(report.filtros.desde)],
    ["Hasta (inclusive)", excelDate(report.filtros.hasta)], ["Estado", report.filtros.estado ?? "Todos"],
    ["Generado (Guatemala)", new Date(new Date(report.generado).getTime() - 6 * 3600000)],
    ["Reservas", report.resumen.reservas], ["Huéspedes (suma por reserva)", report.resumen.huespedes],
    ["Noches dentro del período", report.resumen.noches_periodo], ["Importe reservado (GTQ)", report.resumen.importe_reservado],
    ["Reservas canceladas", report.resumen.canceladas], ["Importe de canceladas (GTQ)", report.resumen.importe_cancelado],
    [report.nota_importes],
  ]);
  for (const row of [1, 2, 3, 15]) summary.mergeCells(`A${row}:B${row}`);
  summary.getRow(1).height = 32;
  summary.getRow(2).height = 30;
  summary.getRow(3).height = 48;
  summary.getRow(15).height = 60;
  for (let row = 4; row <= 14; row++) summary.getRow(row).height = 25;
  summary.getCell("B5").numFmt = summary.getCell("B6").numFmt = "dd/mm/yyyy";
  summary.getCell("B8").numFmt = "dd/mm/yyyy hh:mm:ss";
  summary.getCell("B12").numFmt = summary.getCell("B14").numFmt = '"Q"#,##0.00';
  summary.eachRow(row => row.eachCell(cell => { cell.alignment = { vertical: "middle", wrapText: true }; }));
  summary.getRow(1).font = { name: "Calibri", size: 18, bold: true, color: { argb: "FF765436" } };
  summary.getRow(2).font = { name: "Calibri", size: 13, bold: true };

  const sheet = workbook.addWorksheet("Reservas", { views: [{ state: "frozen", ySplit: 1, showGridLines: false }] });
  sheet.columns = [
    { header: "Reserva", width: 12 }, { header: "Sede", width: 30 }, { header: "Habitación", width: 15 },
    { header: "Tipo de habitación", width: 26 }, { header: "Entrada", width: 15 }, { header: "Salida", width: 15 },
    { header: "Estado", width: 18 }, { header: "Huéspedes", width: 14 }, { header: "Noches en período", width: 18 },
    { header: "Importe reservado (GTQ)", width: 23 },
  ];
  for (const record of report.registros) {
    const row = sheet.addRow([record.id, record.sede, record.habitacion, record.tipo_habitacion,
      excelDate(record.fecha_entrada), excelDate(record.fecha_salida), record.estado,
      record.huespedes, record.noches_periodo, record.importe_reservado]);
    row.height = Math.max(28, Math.ceil(record.sede.length / 26) * 15, Math.ceil(record.tipo_habitacion.length / 22) * 15);
    row.eachCell(cell => { cell.alignment = { vertical: "middle", wrapText: true }; });
    if (row.number % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F2EE" } };
  }
  const total = sheet.addRow(["TOTAL", null, null, null, null, null, null, report.resumen.huespedes, report.resumen.noches_periodo, report.resumen.importe_reservado]);
  total.font = { bold: true };
  total.height = 28;
  sheet.getRow(1).height = 36;
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF765436" } };
  sheet.getRow(1).alignment = { vertical: "middle", wrapText: true };
  sheet.getColumn(5).numFmt = sheet.getColumn(6).numFmt = "dd/mm/yyyy";
  sheet.getColumn(10).numFmt = '"Q"#,##0.00';
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, report.registros.length + 1), column: 10 } };
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:1" };
  sheet.headerFooter.oddFooter = "&LHOTEL HUNAHPÚ&R&P / &N";
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

/** Export the same report DTO used by JSON/PDF; no reaggregation or price lookup. */
export async function renderOperationalReportExcel(report: OperationalReport): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HOTEL HUNAHPÚ";
  workbook.created = new Date(report.generado);
  const summary = workbook.addWorksheet("Resumen", { views: [{ showGridLines: false }] });
  summary.getColumn(1).width = 48;
  summary.getColumn(2).width = 95;
  summary.addRows([["HOTEL HUNAHPÚ"], [report.titulo], [report.criterio], ["Sede", report.sede],
    ["Desde (inclusive)", excelDate(report.filtros.desde)], ["Hasta (inclusive)", excelDate(report.filtros.hasta)],
    ["Estado", report.filtros.estado ?? "Todos"], ["Generado (Guatemala)", new Date(new Date(report.generado).getTime() - 6 * 3600000)],
    ...report.metricas.map(metric => [metric.etiqueta, report.resumen[metric.clave]]), [report.nota]]);
  for (const n of [1, 2, 3, summary.rowCount]) summary.mergeCells(`A${n}:B${n}`);
  summary.eachRow(row => { row.height = row.number === summary.rowCount ? 90 : row.number === 3 ? 45 : 28;
    row.eachCell(cell => { cell.alignment = { vertical: "middle", wrapText: true }; }); });
  summary.getRow(1).font = { size: 18, bold: true, color: { argb: "FF765436" } };
  summary.getRow(2).font = { size: 13, bold: true };
  summary.getCell("B5").numFmt = summary.getCell("B6").numFmt = "dd/mm/yyyy";
  summary.getCell("B8").numFmt = "dd/mm/yyyy hh:mm:ss";
  report.metricas.forEach((metric, index) => { if (metric.formato === "importe") summary.getCell(`B${9 + index}`).numFmt = '"Q"#,##0.00'; });
  const detail = workbook.addWorksheet("Detalle", { views: [{ state: "frozen", ySplit: 1, showGridLines: false }] });
  detail.columns = report.columnas.map(column => ({ header: column.etiqueta, width: ["sede", "servicio", "salon", "terapeuta"].includes(column.clave) ? 32 : 22 }));
  for (const record of report.registros) {
    const row = detail.addRow(report.columnas.map(column => column.formato === "fecha" && record[column.clave] != null ? excelDate(String(record[column.clave])) : record[column.clave]));
    row.height = Math.max(30, ...report.columnas.map((column, i) => Math.ceil(String(record[column.clave] ?? "").length / (detail.getColumn(i + 1).width! - 3)) * 15));
    row.eachCell(cell => { cell.alignment = { vertical: "middle", wrapText: true }; });
    if (row.number % 2 === 0) row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F2EE" } };
  }
  report.columnas.forEach((column, i) => { if (column.formato === "importe") detail.getColumn(i + 1).numFmt = '"Q"#,##0.00';
    if (column.formato === "fecha") detail.getColumn(i + 1).numFmt = "dd/mm/yyyy"; });
  detail.getRow(1).height = 36;
  detail.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  detail.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF765436" } };
  detail.getRow(1).alignment = { vertical: "middle", wrapText: true };
  detail.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, report.registros.length + 1), column: report.columnas.length } };
  detail.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: "1:1" };
  detail.headerFooter.oddFooter = "&LHOTEL HUNAHPÚ&R&P / &N";
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
