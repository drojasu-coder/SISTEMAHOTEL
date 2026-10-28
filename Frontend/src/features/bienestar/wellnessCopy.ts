import { useLocale } from '@/i18n/LocaleContext';

/** Textos propios del recorrido público de Bienestar: [español, inglés]. */
const wellnessCopy = {
  pastDateTime: [
    'La fecha y hora de la cita no pueden ser anteriores al momento actual en Guatemala.',
    'The appointment date and time cannot be earlier than the current time in Guatemala.',
  ],
  onlineUnavailableTitle: [
    'Las citas en línea no están disponibles en este momento',
    'Online appointments are not available right now',
  ],
  onlineUnavailableDesc: [
    'No hay terapeutas activos para atender esta selección. Puede consultar los servicios y comunicarse con el hotel.',
    'There are no active therapists for this selection. You can browse the services and contact the hotel.',
  ],
  selectedService: ['Servicio seleccionado', 'Selected service'],
} as const satisfies Record<string, readonly [string, string]>;

export type WellnessCopyKey = keyof typeof wellnessCopy;

export function useWellnessCopy() {
  const { locale } = useLocale();
  return (key: WellnessCopyKey) => wellnessCopy[key][locale === 'en' ? 1 : 0];
}
