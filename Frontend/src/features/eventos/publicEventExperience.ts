import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventosApi } from './api/eventosApi';
import { eventosQueryKeys } from './constants/queryKeys';
import type { CreateReservaEventoInput, Salon } from './types';

/** Textos exclusivos del recorrido público; no modifica traducciones compartidas. */
export const publicEventCopy = {
  es: {
    introduction: 'Explore los salones por sede, capacidad y tarifa base. Consulte sus detalles y prepare una solicitud de cotización.',
    search: 'Buscar salón, descripción o sede', siteUnknown: 'Sede no informada', capacityUnknown: 'Capacidad no informada',
    capacityFilter: 'Capacidad mínima', anyCapacity: 'Cualquier capacidad', capacityPeople: '{n} personas',
    signInToQuote: 'Inicie sesión para enviar su solicitud de cotización. Sus datos se conservan.',
    descriptionMissing: 'Este salón no tiene una descripción publicada.',
    invalidId: 'Identificador de salón no válido', invalidIdHelp: 'Regrese al catálogo para elegir uno de los salones publicados.',
    notFound: 'No se encontró este salón', notFoundHelp: 'Puede regresar al catálogo para explorar los salones publicados.',
    loadError: 'No pudimos cargar el salón. Compruebe su conexión e intente consultar de nuevo.',
    quoteNotice: 'La solicitud se registra como cotización. Su estado y sus importes se muestran al completar el envío; no equivale a una reserva confirmada.',
    quoteDescription: 'Indique el tipo de evento, la fecha, el horario y el número de invitados. Revisaremos la disponibilidad al enviar la solicitud.',
    rateHint: 'La tarifa base corresponde al salón. Consulte el importe de su cotización al completar la solicitud.',
    capacityError: 'El número de invitados supera la capacidad máxima del salón.',
    conflict: 'El salón no está disponible en ese horario. Cambie la fecha o las horas e intente de nuevo. No tenemos otros horarios verificados para ofrecerle.',
    inactive: 'La sede de este salón no admite solicitudes en este momento. Puede explorar otra sede.',
    dateError: 'Revise la fecha del evento; no puede estar en el pasado.',
    timeError: 'La hora de fin debe ser posterior a la hora de inicio.',
    requestError: 'No pudimos completar la solicitud. Revise los datos e intente de nuevo.',
    success: 'Cotización registrada', reference: 'Referencia de su solicitud', viewRequest: 'Ver mi solicitud', myRequests: 'Mis solicitudes de eventos',
    referenceMissing: 'La respuesta no permite verificar la solicitud. Consulte Mis solicitudes antes de volver a enviarla.',
    uncertain: 'No pudimos confirmar el resultado del envío. La solicitud podría haberse registrado. Compruebe Mis solicitudes antes de enviar otra.',
    checkRequests: 'Comprobar mis solicitudes', checkError: 'No pudimos consultar sus solicitudes. El envío continúa bloqueado; puede intentar consultar de nuevo.',
    noMatch: 'La consulta no encontró una solicitud con estos datos. Una petición anterior aún podría estar procesándose. Revise Mis solicitudes antes de preparar otra.',
    prepareAgain: 'He revisado mis solicitudes; preparar otro envío',
    total: 'Importe de la cotización', details: 'Datos de la solicitud', financialNotice: 'El estado de la solicitud no acredita un pago.',
  },
  en: {
    introduction: 'Explore venues by location, capacity and base rate. View the details and prepare a quote request.',
    search: 'Search venues, descriptions or locations', siteUnknown: 'Location not provided', capacityUnknown: 'Capacity not provided',
    capacityFilter: 'Minimum capacity', anyCapacity: 'Any capacity', capacityPeople: '{n} people',
    signInToQuote: 'Sign in to submit your quote request. Your details are preserved.',
    descriptionMissing: 'No description has been published for this venue.',
    invalidId: 'Invalid venue ID', invalidIdHelp: 'Return to the catalog to choose a published venue.',
    notFound: 'Venue not found', notFoundHelp: 'Return to the catalog to explore published venues.',
    loadError: 'We could not load the venue. Check your connection and try loading it again.',
    quoteNotice: 'Your request is recorded as a quote. Its status and amounts are shown after submission; it is not a confirmed reservation.',
    quoteDescription: 'Enter the event type, date, times and number of guests. Availability is checked when you submit the request.',
    rateHint: 'The base rate applies to the venue. Review your quote amount after submitting the request.',
    capacityError: 'The number of guests exceeds the venue’s maximum capacity.',
    conflict: 'The venue is unavailable at that time. Change the date or times and try again. We have no other verified times to offer.',
    inactive: 'This venue’s location is not accepting requests at this time. You can explore another location.',
    dateError: 'Check the event date; it cannot be in the past.',
    timeError: 'The end time must be after the start time.',
    requestError: 'We could not complete the request. Review the details and try again.',
    success: 'Quote recorded', reference: 'Your request reference', viewRequest: 'View my request', myRequests: 'My event requests',
    referenceMissing: 'The response does not allow us to verify the request. Check My requests before submitting again.',
    uncertain: 'We could not confirm the submission result. Your request may have been registered. Check My requests before submitting another.',
    checkRequests: 'Check my requests', checkError: 'Your requests could not be loaded. Submission remains blocked; you may try the lookup again.',
    noMatch: 'No request with those details was found. An earlier request may still be processing. Review My requests before preparing another.',
    prepareAgain: 'I have reviewed my requests; prepare another submission',
    total: 'Quote amount', details: 'Request details', financialNotice: 'The request status does not prove payment.',
  },
};

/** Una búsqueda comercial no requiere escribir las tildes del nombre publicado. */
export const normalizeVenueSearch = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim();

/** El backend publica Sucursal; se conserva compatibilidad con el DTO anterior. */
export function publicVenueSite(salon: Salon, sites: readonly { id: number; nombre: string }[]) {
  const actual = salon as Salon & { Sucursal?: { nombre?: string } };
  return sites.find((site) => site.id === salon.sucursal_id)?.nombre || actual.Sucursal?.nombre || salon.sucursal?.nombre;
}

/** Mutación local al flujo público: sin alterar hooks de administración. */
export function usePublicEventQuoteMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReservaEventoInput) => eventosApi.createReserva(input),
    retry: false,
    onSuccess: () => { void client.invalidateQueries({ queryKey: eventosQueryKeys.allReservas }); },
  });
}
