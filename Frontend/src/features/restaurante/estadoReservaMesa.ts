/**
 * Presentación del estado persistido de una reserva de mesa. Un valor no
 * reconocido se muestra como desconocido: nunca se asume que está confirmada.
 */
const CLASES: Record<string, string> = {
  confirmada: "bg-exito-50 text-exito-700 border-exito-600/20",
  cancelada: "bg-error-50 text-error-700 border-error-600/20",
};
const CLASE_DESCONOCIDO = "bg-neutro-100 text-neutro-700 border-neutro-300";

interface EtiquetasEstado {
  confirmada: string;
  cancelada: string;
  desconocido: string;
}

export const estadoReservaMesa = (estado: string | null | undefined, etiquetas: EtiquetasEstado) => {
  const conocido = estado === "confirmada" || estado === "cancelada";
  return {
    conocido,
    label: conocido ? etiquetas[estado] : etiquetas.desconocido,
    className: conocido ? CLASES[estado] : CLASE_DESCONOCIDO,
  };
};
