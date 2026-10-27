import { es } from "@/i18n/es";

/**
 * Textos del módulo de tipos de habitación delegados al diccionario global de traducciones (`src/i18n/es.ts`).
 */
export const textosTiposHabitacion = {
  ...es.tiposHabitacion,
  tiposMostrados: (count: number) =>
    count === 1 ? "1 tipo mostrado" : `${count} tipos mostrados`,
};

export function formatGTQ(monto: number | string | null | undefined): string {
  if (monto === null || monto === undefined || monto === "") return "Q0.00";
  const num = typeof monto === "number" ? monto : parseFloat(monto);
  if (Number.isNaN(num)) return "Q0.00";
  return `Q${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
