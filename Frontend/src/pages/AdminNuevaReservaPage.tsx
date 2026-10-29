import React, { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BedDouble, Banknote, CheckCircle2, ChevronLeft, ChevronRight, Clock, Search, UserPlus, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { ApiError } from '@/api/client/http';
import { getApiErrorMessage } from '@/api/errors';
import { useAuth } from '@/features/auth/AuthContext';
import { useAdminScope } from '@/features/admin-core/AdminScopeContext';
import { formatAdminCalendarDate } from '@/features/admin-core/adminDates';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { StayDateRange } from '@/features/habitaciones/public/StayDateRange';
import { GuestCount } from '@/features/habitaciones/public/GuestCount';
import { commercialRoomName } from '@/features/habitaciones/public/roomCategories';
import { reservasApi } from '@/features/reservas/api/reservasApi';
import { reservasHabitacionQueryKeys } from '@/features/reservas/constants/queryKeys';
import { reservasAdminQueryKeys } from '@/features/reservas/admin/types';
import { CobroEfectivoPanel, nuevaClaveCobro } from '@/features/reservas/admin/components/CobroEfectivoPanel';
import type { CreateReservaHuespedInput, DisponibilidadHabitacionQuery, HuespedBusqueda, ReservaHabitacion } from '@/features/reservas/types';
import { formatGTQ } from '@/features/mis-reservas/formato';
import { calendarNights } from '@/lib/dates';
import { useLocale } from '@/i18n/LocaleContext';
import { cn } from '@/lib/cn';

const PAGE_SIZE = 6;

const T = {
  es: {
    title: 'Nueva reserva', subtitle: 'Reserva presencial en recepción.',
    steps: ['Huésped', 'Fechas y ocupación', 'Habitación', 'Cobro y confirmación'],
    withAccount: 'Cliente registrado', withoutAccount: 'Huésped sin cuenta',
    guestSearch: 'Nombre o correo del cliente', guestHint: 'Escriba al menos 2 caracteres.', guestNone: 'Ningún cliente coincide. Puede registrarlo como huésped sin cuenta.',
    searching: 'Buscando…', change: 'Cambiar',
    fullName: 'Nombre completo', phone: 'Teléfono', email: 'Correo', optional: '(opcional)',
    walkInNote: 'No se crea una cuenta de acceso: solo se registran los datos del titular de la reserva.',
    site: 'Sede', guests: 'Huéspedes', check: 'Ver disponibilidad', noSites: 'Su usuario no tiene ninguna sede activa asignada. Solicite a un administrador que se la asigne.',
    loadingRooms: 'Consultando disponibilidad…', noRooms: 'No hay habitaciones disponibles para esas fechas y ocupación.',
    available: (n: number) => `${n} ${n === 1 ? 'habitación disponible' : 'habitaciones disponibles'}`,
    allTypes: 'Todos los tipos', roomNumber: 'N.º de habitación', noMatch: 'Ninguna habitación coincide con el filtro.',
    room: 'Habitación', upTo: (n: number) => `hasta ${n}`, perNight: '/noche', nights: (n: number) => `${n} ${n === 1 ? 'noche' : 'noches'}`,
    page: (a: number, b: number) => `${a} de ${b}`, prev: 'Anterior', next: 'Siguiente',
    total: 'Total calculado por el servidor', method: 'Método de pago', cash: 'Efectivo',
    cashConfirm: (amount: string) => `Confirmo que recibí ${amount} en efectivo`,
    confirmPay: 'Confirmar reserva y registrar cobro', saving: 'Registrando…',
    missingGuest: 'Complete los datos del huésped.', missingCash: 'Confirme que recibió el efectivo.',
    conflict: 'La habitación acaba de ocuparse. La lista se actualizó: elija otra.',
    done: 'Reserva registrada', donePaid: 'Reserva registrada y pagada en efectivo',
    doneText: (id: number, name: string) => `Reserva #${id} a nombre de ${name}.`,
    statusLabel: 'Estado actual', states: { pendiente: 'Pendiente de pago', confirmada: 'Confirmada', cancelada: 'Cancelada', finalizada: 'Finalizada', expirada: 'Expirada' } as Record<string, string>,
    cashFailed: 'La reserva se registró, pero el cobro no: sigue pendiente de pago. Puede reintentarlo abajo o desde el detalle de la reserva.',
    open: 'Ver detalle', another: 'Nueva reserva', list: 'Ir a reservas', walkInBadge: 'Sin cuenta',
  },
  en: {
    title: 'New reservation', subtitle: 'Walk-in reservation at the front desk.',
    steps: ['Guest', 'Dates & occupancy', 'Room', 'Payment & confirmation'],
    withAccount: 'Registered customer', withoutAccount: 'Guest without account',
    guestSearch: 'Customer name or email', guestHint: 'Type at least 2 characters.', guestNone: 'No customer matches. You can register them as a guest without account.',
    searching: 'Searching…', change: 'Change',
    fullName: 'Full name', phone: 'Phone', email: 'Email', optional: '(optional)',
    walkInNote: 'No login account is created: only the reservation holder details are stored.',
    site: 'Site', guests: 'Guests', check: 'Check availability', noSites: 'Your user has no active site assigned. Ask an administrator to assign one.',
    loadingRooms: 'Checking availability…', noRooms: 'No rooms are available for those dates and occupancy.',
    available: (n: number) => `${n} ${n === 1 ? 'room available' : 'rooms available'}`,
    allTypes: 'All types', roomNumber: 'Room no.', noMatch: 'No room matches the filter.',
    room: 'Room', upTo: (n: number) => `up to ${n}`, perNight: '/night', nights: (n: number) => `${n} ${n === 1 ? 'night' : 'nights'}`,
    page: (a: number, b: number) => `${a} of ${b}`, prev: 'Previous', next: 'Next',
    total: 'Total calculated by the server', method: 'Payment method', cash: 'Cash',
    cashConfirm: (amount: string) => `I confirm I received ${amount} in cash`,
    confirmPay: 'Confirm reservation and record payment', saving: 'Saving…',
    missingGuest: 'Complete the guest details.', missingCash: 'Confirm that you received the cash.',
    conflict: 'The room was just taken. The list was refreshed: choose another one.',
    done: 'Reservation registered', donePaid: 'Reservation registered and paid in cash',
    doneText: (id: number, name: string) => `Reservation #${id} for ${name}.`,
    statusLabel: 'Current status', states: { pendiente: 'Pending payment', confirmada: 'Confirmed', cancelada: 'Cancelled', finalizada: 'Completed', expirada: 'Expired' } as Record<string, string>,
    cashFailed: 'The reservation was registered but the payment was not: it remains pending. You can retry below or from the reservation details.',
    open: 'View details', another: 'New reservation', list: 'Go to reservations', walkInBadge: 'No account',
  },
} as const;

function useDebounced<V>(value: V, ms: number): V {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const id = setTimeout(() => setDebounced(value), ms); return () => clearTimeout(id); }, [value, ms]);
  return debounced;
}

/** Resultado tal como lo confirmó el servidor: estado real de la reserva tras el cobro. */
type Resultado = { reserva: ReservaHabitacion; titular: string; cobro: 'pagado' | 'fallido'; error?: unknown };

/**
 * Reserva presencial de recepción: titular (cliente registrado o huésped sin cuenta),
 * fechas y ocupación, una habitación disponible de la sede del usuario y, opcionalmente,
 * el cobro en efectivo del total calculado por el servidor.
 */
export const AdminNuevaReservaPage: React.FC = () => {
  const { locale } = useLocale();
  const t = T[locale === 'en' ? 'en' : 'es'];
  const { user } = useAuth();
  const scope = useAdminScope();
  const queryClient = useQueryClient();
  const today = getTodayInGuatemala();

  // Paso 1: titular
  const [modo, setModo] = useState<'cliente' | 'sinCuenta'>('cliente');
  const [term, setTerm] = useState('');
  const [cliente, setCliente] = useState<HuespedBusqueda | null>(null);
  const [walkIn, setWalkIn] = useState({ nombre_completo: '', telefono: '', email: '' });

  // Paso 2: sede (automática), fechas y ocupación
  const sedes = useMemo(() => scope.sedes.filter((sede) => sede.activa), [scope.sedes]);
  const [sedeElegida, setSedeElegida] = useState<number | ''>('');
  const sedeAuto = sedes.length === 1 ? sedes[0].id
    : typeof scope.selectedSedeId === 'number' && sedes.some((s) => s.id === scope.selectedSedeId) ? scope.selectedSedeId : null;
  const sedeId = sedeAuto ?? (sedes.some((s) => s.id === sedeElegida) ? (sedeElegida as number) : null);
  const [rango, setRango] = useState({ fecha_entrada: '', fecha_salida: '' });
  const [personas, setPersonas] = useState('1');
  const [criterios, setCriterios] = useState<DisponibilidadHabitacionQuery | null>(null);

  // Paso 3: habitación
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroNumero, setFiltroNumero] = useState('');
  const [pagina, setPagina] = useState(1);
  const [habitacionId, setHabitacionId] = useState<number | null>(null);

  // Paso 4: cobro (en recepción la reserva presencial se cobra siempre en efectivo)
  const [recibido, setRecibido] = useState(false);
  const [conflicto, setConflicto] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const q = useDebounced(term.trim(), 300);
  const clientesQuery = useQuery({
    queryKey: ['recepcion-huespedes', user?.id, q],
    queryFn: ({ signal }) => reservasApi.searchHuespedes(q, signal),
    enabled: modo === 'cliente' && !cliente && q.length >= 2,
    staleTime: 15_000,
  });

  const disponibilidad = useQuery({
    queryKey: criterios ? [...reservasHabitacionQueryKeys.disponibilidad(criterios), 'recepcion', user?.id] : ['recepcion-disponibilidad', 'idle'],
    queryFn: () => reservasApi.getDisponibilidad(criterios!),
    enabled: Boolean(criterios),
    staleTime: 0,
  });
  const habitaciones = disponibilidad.data ?? [];
  const tipos = useMemo(() => [...new Set(habitaciones.map((h) => (h.TipoHabitacion ? commercialRoomName(h.TipoHabitacion) : '')).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [habitaciones]);
  const filtradas = habitaciones.filter((h) =>
    (!filtroTipo || (h.TipoHabitacion && commercialRoomName(h.TipoHabitacion) === filtroTipo)) &&
    (!filtroNumero.trim() || h.numero.toLowerCase().includes(filtroNumero.trim().toLowerCase())));
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);
  const seleccionada = habitaciones.find((h) => h.id === habitacionId) ?? null;

  const fechasValidas = Boolean(rango.fecha_entrada && rango.fecha_salida && rango.fecha_entrada >= today && rango.fecha_salida > rango.fecha_entrada);
  const titularListo = modo === 'cliente' ? Boolean(cliente) : walkIn.nombre_completo.trim().length >= 3;
  const titularNombre = modo === 'cliente' ? cliente?.nombre ?? '' : walkIn.nombre_completo.trim();
  const noSites = !scope.isLoadingSedes && !scope.isErrorSedes && sedes.length === 0;
  const pasoActual = !titularListo ? 0 : !criterios ? 1 : !seleccionada ? 2 : 3;

  const reiniciarBusqueda = () => { setCriterios(null); setHabitacionId(null); setPagina(1); setFiltroTipo(''); setFiltroNumero(''); };
  const buscar = (event: FormEvent) => {
    event.preventDefault();
    if (!sedeId || !fechasValidas) return;
    setConflicto(false);
    setHabitacionId(null);
    setPagina(1);
    setCriterios({ sucursal_id: sedeId, fecha_entrada: rango.fecha_entrada, fecha_salida: rango.fecha_salida, numero_huespedes: Math.max(1, Number(personas) || 1) });
  };

  const confirmar = useMutation({
    retry: false,
    mutationFn: async (): Promise<Resultado> => {
      const base = { habitacion_id: seleccionada!.id, fecha_entrada: criterios!.fecha_entrada, fecha_salida: criterios!.fecha_salida, numero_huespedes: criterios!.numero_huespedes };
      const input: CreateReservaHuespedInput = modo === 'cliente'
        ? { ...base, usuario_id: cliente!.id }
        : { ...base, huesped: { nombre_completo: walkIn.nombre_completo.trim(), ...(walkIn.telefono.trim() ? { telefono: walkIn.telefono.trim() } : {}), ...(walkIn.email.trim() ? { email: walkIn.email.trim() } : {}) } };
      const reserva = await reservasApi.createForGuest(input);
      // Una vez creada la reserva, cualquier fallo del cobro se informa sin volver a crearla.
      try {
        // Importe = total que el servidor calculó al crear la reserva.
        const cobro = await reservasApi.registrarEfectivo(reserva.id, { monto: Number(reserva.total), idempotency_key: nuevaClaveCobro(), efectivo_recibido: true });
        const estado = (cobro.reserva_estado ?? reserva.estado) as ReservaHabitacion['estado'];
        return { reserva: { ...reserva, estado }, titular: titularNombre, cobro: estado === 'confirmada' ? 'pagado' : 'fallido' };
      } catch (error) {
        return { reserva, titular: titularNombre, cobro: 'fallido', error };
      }
    },
    onSuccess: (r) => {
      setResultado(r);
      void queryClient.invalidateQueries({ queryKey: reservasAdminQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: reservasHabitacionQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setConflicto(true);
        setHabitacionId(null);
        void disponibilidad.refetch();
      }
    },
  });

  const reiniciar = () => {
    setResultado(null); setCliente(null); setTerm(''); setWalkIn({ nombre_completo: '', telefono: '', email: '' });
    setRango({ fecha_entrada: '', fecha_salida: '' }); setPersonas('1'); reiniciarBusqueda(); setRecibido(false); confirmar.reset();
  };

  const date = (value: string) => formatAdminCalendarDate(value, locale);
  const card = 'rounded-xl border border-neutro-200 bg-white p-4 sm:p-5';
  const stepTitle = (n: number) => <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-neutro-900">
    <span className={cn('inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums', pasoActual > n ? 'bg-exito-600 text-white' : pasoActual === n ? 'bg-bronce-700 text-white' : 'bg-neutro-100 text-neutro-600')}>{pasoActual > n ? '✓' : n + 1}</span>{t.steps[n]}
  </h2>;

  if (resultado) {
    const { reserva } = resultado;
    return <div className="mx-auto w-full max-w-2xl space-y-4 pb-12">
      <section className={card} aria-live="polite">
        <div className="flex items-start gap-3">
          {resultado.cobro === 'pagado' ? <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-exito-700" aria-hidden /> : <Clock className="mt-0.5 size-6 shrink-0 text-bronce-700" aria-hidden />}
          <div className="min-w-0 space-y-1.5">
            <h1 className="font-sans text-xl font-semibold text-neutro-900">{resultado.cobro === 'pagado' ? t.donePaid : t.done}</h1>
            <p className="text-sm text-neutro-700">{t.doneText(reserva.id, resultado.titular)}</p>
            <p className="text-sm text-neutro-700">{date(reserva.fecha_entrada)} – {date(reserva.fecha_salida)} · {formatGTQ(reserva.total)}</p>
            <p className="text-sm text-neutro-700">{t.statusLabel}: <strong className="font-semibold text-neutro-900">{t.states[reserva.estado] ?? reserva.estado}</strong></p>
          </div>
        </div>
        {resultado.cobro === 'fallido' && <div className="mt-3"><Alert tone="error" title={t.cashFailed}>{resultado.error ? getApiErrorMessage(resultado.error) : null}</Alert></div>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/admin/reservas/${reserva.id}`} className="inline-flex min-h-10 items-center rounded-lg bg-bronce-700 px-4 text-sm font-semibold text-white hover:bg-bronce-800">{t.open}</Link>
          <Button variant="secondary" onClick={reiniciar}>{t.another}</Button>
          <Link to="/admin/reservas?vista=todas" className="inline-flex min-h-10 items-center px-2 text-sm font-semibold text-bronce-700 hover:underline">{t.list}</Link>
        </div>
      </section>
      {resultado.cobro !== 'pagado' && <CobroEfectivoPanel reservaId={reserva.id} estadoReserva={reserva.estado} />}
    </div>;
  }

  return <div className="mx-auto w-full max-w-4xl space-y-4 pb-12">
    <header>
      <h1 className="font-sans text-2xl font-semibold tracking-tight text-neutro-900">{t.title}</h1>
      <p className="mt-0.5 text-sm text-neutro-600">{t.subtitle}{sedeAuto ? ` · ${sedes.find((s) => s.id === sedeAuto)?.nombre}` : ''}</p>
    </header>

    {scope.isLoadingSedes && <LoadingNotice label={t.loadingRooms} />}
    {noSites && <Alert tone="info">{t.noSites}</Alert>}

    {!noSites && !scope.isLoadingSedes && <>
      {/* 1. Huésped */}
      <section className={card} aria-label={t.steps[0]}>
        {stepTitle(0)}
        <div role="radiogroup" aria-label={t.steps[0]} className="mt-3 inline-flex rounded-lg border border-neutro-200 p-0.5 text-sm">
          {(['cliente', 'sinCuenta'] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={modo === m} onClick={() => setModo(m)}
            className={cn('inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 font-medium', modo === m ? 'bg-bronce-50 text-bronce-800' : 'text-neutro-600 hover:text-neutro-900')}>
            {m === 'cliente' ? <UserRound className="size-4" aria-hidden /> : <UserPlus className="size-4" aria-hidden />}{m === 'cliente' ? t.withAccount : t.withoutAccount}</button>)}
        </div>
        {modo === 'cliente' ? (cliente
          ? <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-bronce-200 bg-bronce-50 px-3 py-2">
              <span className="min-w-0"><span className="block font-semibold text-neutro-900">{cliente.nombre}</span><span className="block truncate text-xs text-neutro-600">{cliente.email}</span></span>
              <Button variant="text" size="sm" onClick={() => setCliente(null)}><X className="size-3.5" aria-hidden />{t.change}</Button>
            </div>
          : <div className="mt-3 space-y-2">
              <label className="relative block"><span className="sr-only">{t.guestSearch}</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutro-400" aria-hidden />
                <input type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder={t.guestSearch} className="field-control !pl-9" autoComplete="off" /></label>
              {q.length < 2 ? <p className="text-xs text-neutro-500">{t.guestHint}</p>
                : clientesQuery.isFetching && !clientesQuery.data ? <p className="text-xs text-neutro-500" role="status">{t.searching}</p>
                : clientesQuery.isError ? <Alert tone="error">{getApiErrorMessage(clientesQuery.error)}</Alert>
                : (clientesQuery.data ?? []).length === 0 ? <p className="text-sm text-neutro-600" role="status">{t.guestNone}</p>
                : <ul className="max-h-60 divide-y divide-neutro-100 overflow-y-auto rounded-lg border border-neutro-200">{clientesQuery.data!.map((h) => <li key={h.id}>
                    <button type="button" onClick={() => setCliente(h)} className="flex min-h-11 w-full flex-col justify-center px-3 py-1.5 text-left hover:bg-bronce-50">
                      <span className="font-medium text-neutro-900">{h.nombre}</span><span className="truncate text-xs text-neutro-600">{h.email}{h.telefono ? ` · ${h.telefono}` : ''}</span></button></li>)}</ul>}
            </div>)
          : <div className="mt-3 space-y-2">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-neutro-700 sm:col-span-3">{t.fullName}
                  <input required value={walkIn.nombre_completo} maxLength={150} autoComplete="off" onChange={(e) => setWalkIn({ ...walkIn, nombre_completo: e.target.value })} className="field-control" /></label>
                <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-neutro-700">{t.phone} <span className="sr-only">{t.optional}</span>
                  <input type="tel" value={walkIn.telefono} maxLength={30} autoComplete="off" onChange={(e) => setWalkIn({ ...walkIn, telefono: e.target.value })} className="field-control" placeholder={t.optional} /></label>
                <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-neutro-700 sm:col-span-2">{t.email} <span className="sr-only">{t.optional}</span>
                  <input type="email" value={walkIn.email} maxLength={150} autoComplete="off" onChange={(e) => setWalkIn({ ...walkIn, email: e.target.value })} className="field-control" placeholder={t.optional} /></label>
              </div>
              <p className="text-xs text-neutro-500">{t.walkInNote}</p>
            </div>}
      </section>

      {/* 2. Fechas y ocupación (la sede se toma del usuario) */}
      <form className={card} aria-label={t.steps[1]} onSubmit={buscar}>
        {stepTitle(1)}
        <div className="mt-3 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
          <StayDateRange value={rango} onChange={(r) => { setRango(r); reiniciarBusqueda(); }} />
          <GuestCount label={t.guests} value={personas} max={20} onChange={(v) => { setPersonas(v); reiniciarBusqueda(); }} />
        </div>
        {!sedeAuto && sedes.length > 1 && <label className="mt-3 flex max-w-xs flex-col gap-1 text-xs font-medium text-neutro-700">{t.site}
          <select required value={sedeElegida} onChange={(e) => { setSedeElegida(e.target.value ? Number(e.target.value) : ''); reiniciarBusqueda(); }} className="field-control">
            <option value="">—</option>
            {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select></label>}
        <div className="mt-3"><Button type="submit" disabled={!sedeId || !fechasValidas}><Search className="size-4" aria-hidden />{t.check}</Button></div>
      </form>

      {/* 3. Habitación */}
      {criterios && <section className={card} aria-label={t.steps[2]}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {stepTitle(2)}
          {disponibilidad.isSuccess && <span className="text-xs text-neutro-500">{t.available(habitaciones.length)}</span>}
        </div>
        {conflicto && <div className="mt-3"><Alert tone="error">{t.conflict}</Alert></div>}
        {disponibilidad.isLoading ? <div className="mt-3"><LoadingNotice label={t.loadingRooms} /></div>
          : disponibilidad.isError ? <div className="mt-3"><Alert tone="error">{getApiErrorMessage(disponibilidad.error)}</Alert></div>
          : habitaciones.length === 0 ? <p className="mt-3 text-sm text-neutro-600" role="status">{t.noRooms}</p>
          : <>
            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <select aria-label={t.allTypes} value={filtroTipo} onChange={(e) => { setFiltroTipo(e.target.value); setPagina(1); }} className="field-control">
                <option value="">{t.allTypes}</option>
                {tipos.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
              <input type="search" inputMode="numeric" aria-label={t.roomNumber} placeholder={t.roomNumber} value={filtroNumero} onChange={(e) => { setFiltroNumero(e.target.value); setPagina(1); }} className="field-control" />
            </div>
            {filtradas.length === 0 ? <p className="mt-3 text-sm text-neutro-600" role="status">{t.noMatch}</p>
              : <div role="radiogroup" aria-label={t.steps[2]} className="mt-3 grid gap-2 sm:grid-cols-2">
                {visibles.map((h) => <button key={h.id} type="button" role="radio" aria-checked={habitacionId === h.id} onClick={() => setHabitacionId(h.id)}
                  className={cn('flex min-h-14 items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors', habitacionId === h.id ? 'border-bronce-600 bg-bronce-50 ring-1 ring-bronce-600' : 'border-neutro-200 hover:border-bronce-300')}>
                  <BedDouble className="size-5 shrink-0 text-bronce-700" aria-hidden />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-neutro-900">{t.room} {h.numero}</span>
                    <span className="block truncate text-xs text-neutro-600">{h.TipoHabitacion ? commercialRoomName(h.TipoHabitacion) : ''} · {t.upTo(h.TipoHabitacion?.capacidad_maxima ?? 0)}</span></span>
                  <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-neutro-900">{formatGTQ(h.total_estimado)}<span className="block text-[0.6875rem] font-normal text-neutro-500">{formatGTQ(h.tarifa_noche)}{t.perNight}</span></span>
                </button>)}
              </div>}
            {totalPaginas > 1 && <div className="mt-3 flex items-center justify-end gap-2 text-xs text-neutro-600">
              <Button variant="ghost" size="sm" disabled={paginaActual <= 1} onClick={() => setPagina(paginaActual - 1)} aria-label={t.prev}><ChevronLeft className="size-4" aria-hidden /></Button>
              <span className="tabular-nums">{t.page(paginaActual, totalPaginas)}</span>
              <Button variant="ghost" size="sm" disabled={paginaActual >= totalPaginas} onClick={() => setPagina(paginaActual + 1)} aria-label={t.next}><ChevronRight className="size-4" aria-hidden /></Button>
            </div>}
          </>}
      </section>}

      {/* 4. Cobro y confirmación */}
      {criterios && seleccionada && <section className={card} aria-label={t.steps[3]}>
        {stepTitle(3)}
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-neutro-50 px-3 py-2.5 text-sm">
          <span className="min-w-0 text-neutro-700">
            <span className="font-semibold text-neutro-900">{titularNombre || '—'}</span>{modo === 'sinCuenta' && <span className="ml-1.5 rounded-full bg-neutro-200 px-1.5 py-0.5 text-[0.6875rem]">{t.walkInBadge}</span>}
            <span className="block text-xs">{t.room} {seleccionada.numero} · {date(criterios.fecha_entrada)} – {date(criterios.fecha_salida)} · {t.nights(calendarNights(criterios.fecha_entrada, criterios.fecha_salida) ?? 0)} · {criterios.numero_huespedes} {t.guests.toLowerCase()}</span>
          </span>
          <span className="text-right"><span className="block text-lg font-semibold tabular-nums text-neutro-900">{formatGTQ(seleccionada.total_estimado)}</span><span className="text-[0.6875rem] text-neutro-500">{t.total}</span></span>
        </div>
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-neutro-700"><Banknote className="size-4 text-bronce-700" aria-hidden />{t.method}: <strong className="font-semibold text-neutro-900">{t.cash}</strong></p>
        <label className="mt-3 flex items-start gap-2 text-sm text-neutro-800"><input type="checkbox" required className="mt-0.5 size-4 accent-bronce-700" checked={recibido} onChange={(e) => setRecibido(e.target.checked)} />
          <span>{t.cashConfirm(formatGTQ(seleccionada.total_estimado) ?? '')}</span></label>
        {confirmar.isError && !conflicto && <div className="mt-3"><Alert tone="error">{getApiErrorMessage(confirmar.error)}</Alert></div>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Requiere huésped, fechas y habitación (esta sección solo existe con ambos) y el efectivo confirmado. */}
          <Button onClick={() => { if (confirmar.isPending) return; setConflicto(false); confirmar.mutate(); }} disabled={!titularListo || !criterios || !seleccionada || !recibido || confirmar.isPending} isLoading={confirmar.isPending}>
            {confirmar.isPending ? t.saving : t.confirmPay}</Button>
          {!titularListo ? <span className="text-xs text-neutro-500">{t.missingGuest}</span> : !recibido ? <span className="text-xs text-neutro-500">{t.missingCash}</span> : null}
        </div>
      </section>}
    </>}
  </div>;
};
