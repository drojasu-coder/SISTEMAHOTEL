import React, { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, ChevronDown, Compass, Heart, LogIn, LogOut, MapPin, Mountain, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { getApiErrorMessage } from '@/api/errors';
import { cn } from '@/lib/cn';
import { useMisReservasQuery } from '@/features/mis-reservas/hooks/useMisReservas';
import { useSedesFallback } from '@/features/mis-reservas/hooks/useSedesFallback';
import { useMisReservasActividadQuery } from '@/features/actividades/hooks/useReservasActividad';
import { useMisReservasAmenidadQuery } from '@/features/amenidades/hooks/useReservasAmenidad';
import { useMisCitasSpaQuery } from '@/features/bienestar/hooks/useBienestar';
import { RESERVAS_ROUTES } from '@/features/reservas/constants/routes';
import {
  ahoraEnGuatemala,
  construirItinerario,
  type BloqueItinerario,
  type DiaItinerario,
  type Estancia,
  type EventoServicio,
  type TipoEvento,
} from '../itinerario';
import { useTextosMiViaje } from '../textos';

type T = ReturnType<typeof useTextosMiViaje>['t'];
type Locale = ReturnType<typeof useTextosMiViaje>['locale'];
type Sedes = ReadonlyMap<number, string>;

const ICONO_TIPO: Record<TipoEvento, React.ComponentType<{ className?: string }>> = {
  actividad: Compass,
  experiencia: Mountain,
  amenidad: Sparkles,
  bienestar: Heart,
};

function formatearDia(fecha: string, locale: Locale, formato: 'agenda' | 'corto' | 'completo' = 'agenda'): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', {
    ...(formato !== 'corto' ? { weekday: 'long' as const } : {}),
    ...(formato !== 'agenda' ? { year: 'numeric' as const } : {}),
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(anio, mes - 1, dia)));
}

function formatearHora(hora: string, locale: Locale): string {
  const [h, m] = hora.split(':').map(Number);
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-GT', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: locale === 'en',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(1970, 0, 1, h, m)));
}

const formatearHorario = (evento: EventoServicio, locale: Locale): string | null =>
  evento.horaInicio
    ? [evento.horaInicio, evento.horaFin].filter((h): h is string => h !== null).map((h) => formatearHora(h, locale)).join(' – ')
    : null;

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

function nombreSede(sedeId: number | null, incluido: string | null, sedes: Sedes, t: T): string | null {
  if (incluido) return incluido;
  if (sedeId === null) return null;
  return sedes.get(sedeId) ?? t.sedeId(sedeId);
}

// ---------------------------------------------------------------------------
// Detalles desplegables: solo datos que ya entrega el backend.
// ---------------------------------------------------------------------------

/** Botón de despliegue accesible: comunica estado y región controlada. */
const BotonDetalles: React.FC<{ abierto: boolean; controla: string; titulo: string; onToggle: () => void; t: T; className?: string }> = ({
  abierto, controla, titulo, onToggle, t, className,
}) => (
  <button
    type="button"
    aria-expanded={abierto}
    aria-controls={controla}
    aria-label={`${abierto ? t.ocultarDetalles : t.verDetalles}: ${titulo}`}
    onClick={onToggle}
    className={cn(
      'inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-bronce-700 hover:bg-bronce-50 hover:text-bronce-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-bronce-600',
      className,
    )}
  >
    {abierto ? t.ocultarDetalles : t.verDetalles}
    <ChevronDown className={cn('size-4 transition-transform', abierto && 'rotate-180')} aria-hidden="true" />
  </button>
);

type Campo = [etiqueta: string, valor: React.ReactNode | null];

const ListaDetalles: React.FC<{ campos: Campo[] }> = ({ campos }) => (
  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
    {campos.filter(([, valor]) => valor !== null && valor !== '').map(([etiqueta, valor]) => (
      <div key={etiqueta} className="min-w-0">
        <dt className="text-xs text-neutro-500">{etiqueta}</dt>
        <dd className="break-words text-sm text-neutro-900">{valor}</dd>
      </div>
    ))}
  </dl>
);

const EstadoConfirmado: React.FC<{ t: T }> = ({ t }) => <Badge tone="exito">{t.confirmada}</Badge>;

function camposServicio(evento: EventoServicio, sedes: Sedes, t: T, locale: Locale): Campo[] {
  return [
    [t.campos.servicio, evento.titulo || t.servicioSinNombre],
    [t.campos.tipo, t.tipos[evento.tipo]],
    [t.campos.sede, nombreSede(evento.sedeId, evento.sedeNombre, sedes, t)],
    [t.campos.direccion, evento.sedeDireccion],
    [t.campos.fecha, capitalizar(formatearDia(evento.fecha, locale, 'completo'))],
    [t.campos.horario, formatearHorario(evento, locale)],
    [t.campos.duracion, evento.duracionMinutos ? t.duracion(evento.duracionMinutos) : null],
    [t.campos.participantes, evento.participantes ? String(evento.participantes) : null],
    [evento.tipo === 'bienestar' ? t.campos.terapeuta : t.campos.instructor, evento.persona],
    [t.campos.mobiliario, evento.mobiliario],
    [t.campos.equipo, evento.conEquipo === null ? null : evento.conEquipo ? t.conEquipo : t.sinEquipo],
    [t.campos.referencia, `#${evento.id}`],
    [t.campos.estado, <EstadoConfirmado t={t} />],
  ];
}

// ---------------------------------------------------------------------------
// Piezas de la agenda
// ---------------------------------------------------------------------------

/** Columna de hora: vacía cuando la reserva no registra un horario. */
const ColumnaHora: React.FC<{ inicio: string | null; fin: string | null; locale: Locale }> = ({ inicio, fin, locale }) => (
  <div className="w-16 shrink-0 pt-0.5 text-right text-sm font-semibold tabular-nums text-neutro-800 sm:w-20">
    {inicio && (
      <>
        <span className="block">{formatearHora(inicio, locale)}</span>
        {fin && <span className="block text-xs font-normal text-neutro-500">{formatearHora(fin, locale)}</span>}
      </>
    )}
  </div>
);

const FilaEvento: React.FC<{ evento: EventoServicio; sedes: Sedes; t: T; locale: Locale }> = ({ evento, sedes, t, locale }) => {
  const [abierto, setAbierto] = useState(false);
  const panelId = useId();
  const Icono = ICONO_TIPO[evento.tipo];
  const titulo = evento.titulo || t.servicioSinNombre;
  const resumen = [
    t.tipos[evento.tipo],
    evento.duracionMinutos ? t.duracion(evento.duracionMinutos) : null,
    evento.participantes ? t.participantes(evento.participantes) : null,
    evento.persona ? (evento.tipo === 'bienestar' ? t.terapeuta(evento.persona) : t.instructor(evento.persona)) : null,
  ].filter(Boolean);

  return (
    <li className="flex gap-3 py-3 sm:gap-4">
      <ColumnaHora inicio={evento.horaInicio} fin={evento.horaFin} locale={locale} />
      <Icono className="mt-0.5 size-5 shrink-0 text-bronce-700" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="break-words text-sm font-semibold text-neutro-900">{titulo}</p>
        <p className="text-xs text-neutro-600">{resumen.join(' · ')}</p>
        <BotonDetalles abierto={abierto} controla={panelId} titulo={titulo} onToggle={() => setAbierto((v) => !v)} t={t} className="-ml-2 self-start" />
        <div id={panelId} role="region" aria-label={t.detallesDe(titulo)} hidden={!abierto} className="mt-1 rounded-lg border border-neutro-200 bg-neutro-50 p-3 sm:p-4">
          {abierto && <ListaDetalles campos={camposServicio(evento, sedes, t, locale)} />}
        </div>
      </div>
    </li>
  );
};

/** Llegada y salida solo tienen fecha: no se muestra hora. */
const FilaHito: React.FC<{ tipo: 'llegada' | 'salida'; t: T }> = ({ tipo, t }) => {
  const Icono = tipo === 'llegada' ? LogIn : LogOut;
  return (
    <li className="flex gap-3 py-3 sm:gap-4">
      <div className="w-16 shrink-0 sm:w-20" />
      <Icono className="mt-0.5 size-5 shrink-0 text-neutro-500" aria-hidden="true" />
      <p className="text-sm font-semibold text-neutro-800">{tipo === 'llegada' ? t.llegada : t.salida}</p>
    </li>
  );
};

const EtiquetaHoy: React.FC<{ fecha: string; hoy: string; t: T }> = ({ fecha, hoy, t }) =>
  fecha === hoy ? <Badge tone="info">{t.hoy}</Badge> : null;

const DetallesEstancia: React.FC<{ estancia: Estancia; dias: DiaItinerario[]; sede: string | null; t: T; locale: Locale }> = ({
  estancia, dias, sede, t, locale,
}) => {
  const servicios = dias.flatMap((d) => d.eventos);
  return (
    <div className="flex flex-col gap-4">
      <ListaDetalles
        campos={[
          [t.campos.sede, sede],
          [t.campos.habitacion, estancia.habitacion],
          [t.campos.tipoHabitacion, estancia.tipoHabitacion],
          [t.campos.llegada, capitalizar(formatearDia(estancia.fechaEntrada, locale, 'completo'))],
          [t.campos.salida, capitalizar(formatearDia(estancia.fechaSalida, locale, 'completo'))],
          [t.campos.noches, estancia.noches ? String(estancia.noches) : null],
          [t.campos.huespedes, estancia.huespedes ? String(estancia.huespedes) : null],
          [t.campos.referencia, `#${estancia.id}`],
          [t.campos.estado, <EstadoConfirmado t={t} />],
        ]}
      />
      <div>
        <p className="text-xs text-neutro-500">{t.serviciosEstancia}</p>
        {servicios.length === 0 ? (
          <p className="text-sm text-neutro-900">{t.ninguno}</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {servicios.map((evento) => {
              const horario = formatearHorario(evento, locale);
              return (
                <li key={evento.clave} className="text-sm text-neutro-900">
                  <span className="font-medium">{evento.titulo || t.servicioSinNombre}</span>
                  <span className="text-neutro-600"> · {formatearDia(evento.fecha, locale, 'corto')}{horario ? ` · ${horario}` : ''}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

const BloqueEstancia: React.FC<{ estancia: Estancia; dias: DiaItinerario[]; sedes: Sedes; hoy: string; t: T; locale: Locale }> = ({
  estancia, dias, sedes, hoy, t, locale,
}) => {
  const [abierto, setAbierto] = useState(false);
  const panelId = useId();
  // Solo los días que quedan: llegada (si no pasó), días con servicios y salida.
  const fechas = [...new Set([estancia.fechaEntrada, ...dias.map((d) => d.fecha), estancia.fechaSalida])]
    .filter((fecha) => fecha >= hoy)
    .sort();
  const porFecha = new Map(dias.map((d) => [d.fecha, d.eventos]));
  const sede = nombreSede(estancia.sedeId, estancia.sedeNombre, sedes, t);
  const titulo = sede ?? (estancia.habitacion ? t.habitacion(estancia.habitacion) : t.servicioSinNombre);
  const resumen = [
    estancia.habitacion ? t.habitacion(estancia.habitacion) : null,
    estancia.noches ? t.noches(estancia.noches) : null,
    estancia.huespedes ? t.huespedes(estancia.huespedes) : null,
  ].filter(Boolean);

  return (
    <Card as="article" padding="none">
      <header className="flex flex-col gap-2 border-b border-neutro-200 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex min-w-0 gap-3">
          <BedDouble className="mt-1 size-5 shrink-0 text-bronce-700" aria-hidden="true" />
          <div className="min-w-0">
            <h2 className="break-words font-serif text-lg font-semibold text-neutro-900">{titulo}</h2>
            <p className="text-sm text-neutro-700">
              {formatearDia(estancia.fechaEntrada, locale, 'corto')} – {formatearDia(estancia.fechaSalida, locale, 'corto')}
            </p>
            {resumen.length > 0 && <p className="text-xs text-neutro-600">{resumen.join(' · ')}</p>}
          </div>
        </div>
        <BotonDetalles abierto={abierto} controla={panelId} titulo={titulo} onToggle={() => setAbierto((v) => !v)} t={t} className="-ml-2 self-start sm:ml-0" />
      </header>
      <div id={panelId} role="region" aria-label={t.detallesDe(titulo)} hidden={!abierto} className="border-b border-neutro-200 bg-neutro-50 p-4 sm:p-5">
        {abierto && <DetallesEstancia estancia={estancia} dias={dias} sede={sede} t={t} locale={locale} />}
      </div>
      <div className="px-4 pb-2 sm:px-5">
        {fechas.map((fecha) => (
          <section key={fecha}>
            <h3 className="flex items-center gap-2 pt-4 text-sm font-semibold text-neutro-900">
              <span>{capitalizar(formatearDia(fecha, locale))}</span>
              <EtiquetaHoy fecha={fecha} hoy={hoy} t={t} />
            </h3>
            <ol className="divide-y divide-neutro-100">
              {fecha === estancia.fechaEntrada && <FilaHito tipo="llegada" t={t} />}
              {(porFecha.get(fecha) ?? []).map((evento) => <FilaEvento key={evento.clave} evento={evento} sedes={sedes} t={t} locale={locale} />)}
              {fecha === estancia.fechaSalida && <FilaHito tipo="salida" t={t} />}
            </ol>
          </section>
        ))}
      </div>
    </Card>
  );
};

/** Servicios confirmados sin estancia asociada, agrupados por fecha y sede. */
const BloqueServicios: React.FC<{ bloque: Extract<BloqueItinerario, { tipo: 'servicios' }>; sedes: Sedes; hoy: string; t: T; locale: Locale }> = ({
  bloque, sedes, hoy, t, locale,
}) => {
  const sede = nombreSede(bloque.sedeId, bloque.sedeNombre, sedes, t);
  return (
    <Card as="article" padding="none">
      <header className="flex flex-col gap-0.5 border-b border-neutro-200 p-4 sm:p-5">
        <h2 className="flex flex-wrap items-center gap-2 font-serif text-lg font-semibold text-neutro-900">
          <span>{capitalizar(formatearDia(bloque.fecha, locale))}</span>
          <EtiquetaHoy fecha={bloque.fecha} hoy={hoy} t={t} />
        </h2>
        {sede && (
          <p className="flex items-center gap-1 text-sm text-neutro-700">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {sede}
          </p>
        )}
      </header>
      <ol className="divide-y divide-neutro-100 px-4 sm:px-5">
        {bloque.eventos.map((evento) => <FilaEvento key={evento.clave} evento={evento} sedes={sedes} t={t} locale={locale} />)}
      </ol>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Vista principal
// ---------------------------------------------------------------------------

export const MiViaje: React.FC<{ userId: number }> = ({ userId }) => {
  const { t, locale } = useTextosMiViaje();
  const ahora = ahoraEnGuatemala();
  const minutoActual = `${ahora.fecha} ${ahora.hora}`;

  // Mismas consultas y claves de caché que «Mis reservas»: solo lectura y
  // siempre filtradas por el backend con el usuario del token.
  const fuentes = {
    habitaciones: useMisReservasQuery(userId),
    actividades: useMisReservasActividadQuery(userId),
    amenidades: useMisReservasAmenidadQuery(userId),
    citas: useMisCitasSpaQuery(userId),
  };
  const consultas = Object.entries(fuentes) as [keyof typeof fuentes, (typeof fuentes)[keyof typeof fuentes]][];
  const cargando = consultas.some(([, q]) => q.isPending && q.fetchStatus !== 'idle');
  const fallidas = consultas.filter(([, q]) => q.isError);
  const todasFallaron = fallidas.length === consultas.length;

  const bloques = useMemo(
    () => construirItinerario({
      habitaciones: fuentes.habitaciones.data,
      actividades: fuentes.actividades.data,
      amenidades: fuentes.amenidades.data,
      citas: fuentes.citas.data,
    }, ahora),
    // `ahora` se recalcula en cada render; basta con depender del minuto actual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fuentes.habitaciones.data, fuentes.actividades.data, fuentes.amenidades.data, fuentes.citas.data, minutoActual],
  );

  // El catálogo de sedes solo se pide si algún plan trae el identificador sin
  // el nombre (por ejemplo, las citas de bienestar).
  const necesitaSedes = bloques.some((b) =>
    b.tipo === 'estancia'
      ? (b.estancia.sedeNombre === null && b.estancia.sedeId !== null) || b.dias.some((d) => d.eventos.some((e) => e.sedeNombre === null && e.sedeId !== null))
      : b.eventos.some((e) => e.sedeNombre === null && e.sedeId !== null),
  );
  const sedesQuery = useSedesFallback(necesitaSedes);
  const sedes = useMemo(() => new Map((sedesQuery.data ?? []).map((s) => [s.id, s.nombre])), [sedesQuery.data]);

  const reintentar = () => fallidas.forEach(([, q]) => void q.refetch());

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-semibold text-neutro-900 sm:text-[2rem] sm:leading-[2.375rem]">{t.titulo}</h1>
        <p className="text-sm text-neutro-600">{t.descripcion}</p>
        <Link to={RESERVAS_ROUTES.MIS_RESERVAS} className="mt-1 self-start text-sm font-medium text-bronce-700 hover:underline">
          {t.verMisReservas}
        </Link>
      </header>

      {cargando && <div className="flex justify-center py-12"><LoadingNotice label={t.cargando} /></div>}

      {!cargando && todasFallaron && (
        <Card className="flex flex-col items-start gap-4">
          <Alert tone="error" title={t.errorTitulo}>{getApiErrorMessage(fallidas[0][1].error)}</Alert>
          <Button type="button" variant="ghost" onClick={reintentar}>{t.reintentar}</Button>
        </Card>
      )}

      {!cargando && fallidas.length > 0 && !todasFallaron && (
        <Alert tone="warning">
          <span className="flex flex-col gap-2">
            {fallidas.map(([clave]) => <span key={clave}>{t.errorFuente(t.fuentes[clave])}</span>)}
            <Button type="button" variant="ghost" size="sm" className="self-start" onClick={reintentar}>{t.reintentar}</Button>
          </span>
        </Alert>
      )}

      {!cargando && !todasFallaron && bloques.length === 0 && (
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex max-w-sm flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-neutro-900">{t.vacioTitulo}</h2>
            <p className="text-sm text-neutro-600">{t.vacioDescripcion}</p>
          </div>
          <Link to={RESERVAS_ROUTES.NUEVA} className={buttonStyles({ size: 'sm' })}>{t.explorar}</Link>
        </Card>
      )}

      {!cargando && bloques.length > 0 && (
        <div className="flex flex-col gap-4">
          {bloques.map((bloque) => bloque.tipo === 'estancia'
            ? <BloqueEstancia key={bloque.clave} estancia={bloque.estancia} dias={bloque.dias} sedes={sedes} hoy={ahora.fecha} t={t} locale={locale} />
            : <BloqueServicios key={bloque.clave} bloque={bloque} sedes={sedes} hoy={ahora.fecha} t={t} locale={locale} />)}
        </div>
      )}
    </div>
  );
};
