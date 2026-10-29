import { useLocale } from '@/i18n/LocaleContext';
import type { TipoEvento } from './itinerario';

/**
 * Textos de «Mi viaje» en español e inglés. Viven en el módulo para no tocar
 * los diccionarios globales que se editan en paralelo.
 */
const es = {
  titulo: 'Mi viaje',
  descripcion: 'Tus estancias y servicios confirmados, día a día.',
  verMisReservas: 'Ver todas mis reservas',
  cargando: 'Cargando tu itinerario…',
  errorTitulo: 'No fue posible cargar tu itinerario',
  errorFuente: (fuente: string) => `No fue posible cargar ${fuente}; el itinerario puede estar incompleto.`,
  reintentar: 'Reintentar',
  vacioTitulo: 'Todavía no tienes planes confirmados',
  vacioDescripcion: 'Cuando confirmes una estancia o un servicio, lo verás aquí organizado por día.',
  explorar: 'Explorar reservas',
  fuentes: { habitaciones: 'tus estancias', actividades: 'tus actividades', amenidades: 'tus amenidades', citas: 'tus citas de bienestar' },
  tipos: { actividad: 'Actividad', experiencia: 'Experiencia', amenidad: 'Amenidad', bienestar: 'Bienestar' } satisfies Record<TipoEvento, string>,
  habitacion: (numero: string) => `Habitación ${numero}`,
  noches: (n: number) => (n === 1 ? '1 noche' : `${n} noches`),
  huespedes: (n: number) => (n === 1 ? '1 huésped' : `${n} huéspedes`),
  llegada: 'Llegada',
  salida: 'Salida',
  duracion: (min: number) => (min % 60 === 0 ? `${min / 60} h` : min > 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`),
  participantes: (n: number) => (n === 1 ? '1 participante' : `${n} participantes`),
  instructor: (nombre: string) => `con ${nombre}`,
  terapeuta: (nombre: string) => `con ${nombre}`,
  mobiliario: (valor: string) => `Mobiliario: ${valor}`,
  sedeId: (id: number) => `Sede #${id}`,
  servicioSinNombre: 'Servicio reservado',
  hoy: 'Hoy',
  verDetalles: 'Ver detalles',
  ocultarDetalles: 'Ocultar detalles',
  detallesDe: (titulo: string) => `Detalles de ${titulo}`,
  campos: {
    sede: 'Sede', direccion: 'Dirección', habitacion: 'Habitación', tipoHabitacion: 'Tipo de habitación',
    llegada: 'Llegada', salida: 'Salida', noches: 'Noches', huespedes: 'Huéspedes', referencia: 'Referencia',
    estado: 'Estado', servicio: 'Servicio', tipo: 'Tipo', fecha: 'Fecha', horario: 'Horario', duracion: 'Duración',
    participantes: 'Participantes', instructor: 'Instructor', terapeuta: 'Terapeuta', mobiliario: 'Mobiliario', equipo: 'Equipo',
  },
  confirmada: 'Confirmada',
  conEquipo: 'Incluido',
  sinEquipo: 'No incluido',
  serviciosEstancia: 'Servicios confirmados durante la estancia',
  ninguno: 'Ninguno por ahora',
};

type Textos = { [K in keyof typeof es]: (typeof es)[K] extends (...args: infer A) => string ? (...args: A) => string : (typeof es)[K] extends string ? string : { [P in keyof (typeof es)[K]]: string } };

const en: Textos = {
  titulo: 'My trip',
  descripcion: 'Your confirmed stays and services, day by day.',
  verMisReservas: 'See all my reservations',
  cargando: 'Loading your itinerary…',
  errorTitulo: 'We could not load your itinerary',
  errorFuente: (fuente: string) => `We could not load ${fuente}; the itinerary may be incomplete.`,
  reintentar: 'Try again',
  vacioTitulo: 'You have no confirmed plans yet',
  vacioDescripcion: 'When you confirm a stay or a service, you will see it here organized by day.',
  explorar: 'Explore reservations',
  fuentes: { habitaciones: 'your stays', actividades: 'your activities', amenidades: 'your amenities', citas: 'your wellness appointments' },
  tipos: { actividad: 'Activity', experiencia: 'Experience', amenidad: 'Amenity', bienestar: 'Wellness' },
  habitacion: (numero: string) => `Room ${numero}`,
  noches: (n: number) => (n === 1 ? '1 night' : `${n} nights`),
  huespedes: (n: number) => (n === 1 ? '1 guest' : `${n} guests`),
  llegada: 'Arrival',
  salida: 'Departure',
  duracion: (min: number) => (min % 60 === 0 ? `${min / 60} h` : min > 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`),
  participantes: (n: number) => (n === 1 ? '1 participant' : `${n} participants`),
  instructor: (nombre: string) => `with ${nombre}`,
  terapeuta: (nombre: string) => `with ${nombre}`,
  mobiliario: (valor: string) => `Furniture: ${valor}`,
  sedeId: (id: number) => `Location #${id}`,
  servicioSinNombre: 'Booked service',
  hoy: 'Today',
  verDetalles: 'View details',
  ocultarDetalles: 'Hide details',
  detallesDe: (titulo: string) => `Details of ${titulo}`,
  campos: {
    sede: 'Location', direccion: 'Address', habitacion: 'Room', tipoHabitacion: 'Room type',
    llegada: 'Arrival', salida: 'Departure', noches: 'Nights', huespedes: 'Guests', referencia: 'Reference',
    estado: 'Status', servicio: 'Service', tipo: 'Type', fecha: 'Date', horario: 'Time', duracion: 'Duration',
    participantes: 'Participants', instructor: 'Instructor', terapeuta: 'Therapist', mobiliario: 'Furniture', equipo: 'Equipment',
  },
  confirmada: 'Confirmed',
  conEquipo: 'Included',
  sinEquipo: 'Not included',
  serviciosEstancia: 'Confirmed services during the stay',
  ninguno: 'None for now',
};

export function useTextosMiViaje() {
  const { locale } = useLocale();
  return { t: locale === 'en' ? en : (es as Textos), locale };
}
