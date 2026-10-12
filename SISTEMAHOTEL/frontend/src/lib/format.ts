export const quetzales = (v: number | string | null | undefined) =>
  "Q" + Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "2026-11-18" -> "18 nov 2026" (sin problemas de zona horaria). */
export function fechaCorta(iso: string | null | undefined) {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${meses[m - 1]} ${y}`;
}

export const hoyISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export function sumarDias(iso: string, dias: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

export function noches(entrada: string, salida: string) {
  const a = Date.parse(entrada + "T00:00:00Z");
  const b = Date.parse(salida + "T00:00:00Z");
  return Math.max(0, Math.round((b - a) / 86400000));
}

/** "HH:mm:ss" -> "HH:mm" */
export const hora = (h: string | null | undefined) => (h ? h.slice(0, 5) : "");

export const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replaceAll("_", " ");

/** Horas "09:00", "09:30"... entre `desde` y `hasta` en pasos de `pasoMin` minutos. */
export function franjas(desde: string, hasta: string, pasoMin: number) {
  const out: string[] = [];
  const [h0, m0] = desde.split(":").map(Number);
  const [h1, m1] = hasta.split(":").map(Number);
  for (let t = h0 * 60 + m0; t <= h1 * 60 + m1; t += pasoMin) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`);
  }
  return out;
}

export function sumarMinutos(horaHHmm: string, min: number) {
  const [h, m] = horaHHmm.split(":").map(Number);
  const t = h * 60 + m + min;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
