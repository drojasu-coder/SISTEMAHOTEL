import { useLocale } from '@/i18n/LocaleContext';

/** Textos de acceso a amenidades (reservables o compartidas): [español, inglés]. */
const accessCopy = {
  accessFilter: ['Acceso', 'Access'],
  allAccess: ['Todas', 'All'],
  reservable: ['Con reserva', 'Booking required'],
  compartida: ['Acceso libre', 'Open access'],
  sharedDescription: ['Espacio compartido: no requiere reserva.', 'Shared space: no booking required.'],
  reservableDescription: ['Reserve fecha y horario; el aforo se controla por franja.', 'Book a date and time; capacity is managed per time slot.'],
  notReservableTitle: ['Esta amenidad no requiere reserva', 'This amenity does not require a booking'],
  notReservable: ['Es un espacio compartido. Puede consultar su información, pero no se reserva en línea.', 'It is a shared space. You can view its details, but it is not booked online.'],
  close: ['Cerrar', 'Close'],
} as const satisfies Record<string, readonly [string, string]>;

export type AccessCopyKey = keyof typeof accessCopy;

export function useAccessCopy() {
  const { locale } = useLocale();
  return (key: AccessCopyKey) => accessCopy[key][locale === 'en' ? 1 : 0];
}
