/**
 * Horario y reglas de reservas de mesa del restaurante (hora local de Guatemala).
 *
 * Política:
 * - Apertura: 07:00
 * - Cierre: 22:00
 * - Intervalo entre inicios: 30 minutos
 * - Duración estándar de ocupación: 90 minutos
 * - Última hora de inicio: 20:30 (finaliza a las 22:00 en el cierre)
 */
export const RESTAURANT_BOOKING_HOURS = {
  APERTURA: "07:00",
  CIERRE: "22:00",
  INTERVALO_MINUTOS: 30,
  DURACION_MINUTOS: 90,
  ULTIMO_INICIO: "20:30",
} as const;

export const minutesOf = (hora: string): number => {
  const [hours, minutes] = hora.split(":").map(Number);
  return hours * 60 + minutes;
};

export const toTimeString = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/**
 * Devuelve todas las franjas de inicio posibles dentro del horario (07:00 a 20:30).
 */
export const getAllBookingSlots = (): string[] => {
  const slots: string[] = [];
  const start = minutesOf(RESTAURANT_BOOKING_HOURS.APERTURA);
  const end = minutesOf(RESTAURANT_BOOKING_HOURS.ULTIMO_INICIO);
  for (let m = start; m <= end; m += RESTAURANT_BOOKING_HOURS.INTERVALO_MINUTOS) {
    slots.push(toTimeString(m));
  }
  return slots;
};

/**
 * Dos reservas de la misma mesa colisionan si sus intervalos [inicio, fin)
 * se superponen parcialmente o por completo:
 * inicio_nueva < fin_existente && fin_nueva > inicio_existente
 */
export const intervalsOverlap = (
  inicioA: number,
  finA: number,
  inicioB: number,
  finB: number
): boolean => {
  return inicioA < finB && finA > inicioB;
};
