import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, Info, X } from 'lucide-react';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { useAuth } from '@/features/auth/AuthContext';
import { useCreateReservaAmenidadMutation } from '../hooks/useReservasAmenidad';
import { AMENIDADES_ROUTES } from '../constants/routes';
import { textosAmenidades } from '../textos';
import type { Amenidad, ReservaAmenidad } from '../types';

interface ReservaAmenidadFormModalProps {
  amenidad: Amenidad | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReservaAmenidadFormModal: React.FC<ReservaAmenidadFormModalProps> = ({
  amenidad,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { status, user } = useAuth();
  const t = textosAmenidades.cliente;

  const isCliente = status === 'authenticated' && user?.rol === 'cliente';

  // Obtener fecha de hoy en formato local YYYY-MM-DD
  const hoy = new Date().toISOString().split('T')[0];

  const [fecha, setFecha] = useState(hoy);
  const [horaInicio, setHoraInicio] = useState('10:00');
  const [horaFin, setHoraFin] = useState('12:00');
  const [mobiliario, setMobiliario] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [falloIncierto, setFalloIncierto] = useState(false);
  const [reservaCreada, setReservaCreada] = useState<ReservaAmenidad | null>(null);

  const createMutation = useCreateReservaAmenidadMutation();

  if (!isOpen || !amenidad) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);
    setFalloIncierto(false);

    if (!isCliente) {
      setErrorLocal(t.debeIniciarSesion);
      return;
    }

    if (!fecha) {
      setErrorLocal(t.fechaLabel + ' es obligatoria');
      return;
    }

    if (!horaInicio || !horaFin) {
      setErrorLocal('Debe indicar hora de inicio y de fin');
      return;
    }

    if (horaInicio >= horaFin) {
      setErrorLocal(t.horaInvalida);
      return;
    }

    const franja_horaria = `${horaInicio}-${horaFin}`;

    try {
      const created = await createMutation.mutateAsync({
        amenidad_id: amenidad.id,
        fecha,
        franja_horaria,
        mobiliario: mobiliario.trim() ? mobiliario.trim() : null,
      });
      setReservaCreada(created);
    } catch (err: any) {
      const apiCode = err?.code || err?.response?.data?.code;
      const apiMsg = err?.message || err?.response?.data?.message;

      if (apiCode === 'AMENITY_CAPACITY_FULL') {
        setErrorLocal(t.capacidadExcedida);
      } else if (apiCode === 'AMENITY_RESERVATION_ALREADY_EXISTS') {
        setErrorLocal(t.reservaDuplicada);
      } else if (apiCode === 'AMENITY_DATE_IN_PAST') {
        setErrorLocal(t.fechaEnPasado);
      } else if (apiCode === 'AMENITY_TIME_SLOT_IN_PAST') {
        setErrorLocal(t.horaEnPasado);
      } else if (!err?.status && !err?.response) {
        // Posible fallo de red / incertidumbre
        setFalloIncierto(true);
        setErrorLocal(t.falloConexionIncierto);
      } else {
        setErrorLocal(apiMsg || 'Ocurrió un error al procesar la reserva. Por favor intente nuevamente.');
      }
    }
  };

  const handleCerrar = () => {
    setErrorLocal(null);
    setFalloIncierto(false);
    setReservaCreada(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutro-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reserva-titulo"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-neutro-200 bg-white p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={handleCerrar}
          aria-label={t.cerrar}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-neutro-400 hover:bg-neutro-100 hover:text-neutro-700"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        {reservaCreada ? (
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-verde-100 text-verde-700">
              <CheckCircle className="size-8" aria-hidden="true" />
            </div>
            <h2 id="modal-reserva-titulo" className="text-xl font-serif font-bold text-neutro-900">
              {t.reservaExitosaTitulo}
            </h2>
            <p className="text-sm text-neutro-600 max-w-md">
              {t.reservaExitosaDesc}
            </p>

            <div className="w-full rounded-lg bg-neutro-50 border border-neutro-200 p-4 text-left text-xs space-y-2 mt-2">
              <div className="flex justify-between">
                <span className="text-neutro-500">Amenidad:</span>
                <span className="font-semibold text-neutro-800">{amenidad.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">Fecha:</span>
                <span className="font-semibold text-neutro-800">{reservaCreada.fecha}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutro-500">Horario:</span>
                <span className="font-semibold text-neutro-800">{reservaCreada.franja_horaria}</span>
              </div>
              {reservaCreada.codigo_qr && (
                <div className="flex justify-between border-t border-neutro-200 pt-2">
                  <span className="text-neutro-500">Código de acceso:</span>
                  <span className="font-mono font-bold text-neutro-900">{reservaCreada.codigo_qr}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                onClick={() => {
                  handleCerrar();
                  navigate(AMENIDADES_ROUTES.DETALLE_RESERVA(reservaCreada.id));
                }}
              >
                {t.verDetalle}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => {
                  handleCerrar();
                  navigate(AMENIDADES_ROUTES.MIS_RESERVAS);
                }}
              >
                {t.irMisReservas}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex flex-col gap-1">
              <p className="eyebrow">{amenidad.Sucursal?.nombre || 'Hotel Hunapú'}</p>
              <h2 id="modal-reserva-titulo" className="text-xl font-serif font-bold text-neutro-900">
                {t.reservarModalTitulo}
              </h2>
              <p className="text-sm text-neutro-600">
                {amenidad.nombre} &bull; Aforo máximo: {amenidad.aforo_maximo} personas
              </p>
            </div>

            {!isCliente && (
              <div className="mb-6 rounded-lg border border-azul-200 bg-azul-50 p-4 text-sm text-azul-900">
                <div className="flex gap-2">
                  <Info className="size-5 shrink-0 text-azul-600" aria-hidden="true" />
                  <div className="flex flex-col gap-2">
                    <p>{t.debeIniciarSesion}</p>
                    <Link
                      to="/login"
                      className={buttonStyles({
                        variant: 'primary',
                        size: 'sm',
                        className: 'w-fit',
                      })}
                    >
                      {t.iniciarSesionParaReservar}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {errorLocal && (
              <div className="mb-4">
                <Alert tone={falloIncierto ? 'warning' : 'error'} title={falloIncierto ? 'Aviso de conexión' : 'No se pudo completar la reserva'}>
                  <p>{errorLocal}</p>
                  {falloIncierto && (
                    <div className="mt-2">
                      <Link
                        to={AMENIDADES_ROUTES.MIS_RESERVAS}
                        className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                      >
                        {t.comprobarMisReservas}
                      </Link>
                    </div>
                  )}
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="reserva-fecha" className="block text-xs font-semibold text-neutro-700 mb-1">
                  {t.fechaLabel}
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="reserva-fecha"
                    name="fecha"
                    min={hoy}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                    disabled={!isCliente || createMutation.isPending}
                    className="w-full rounded-md border border-neutro-300 px-3 py-2 text-sm text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500 disabled:bg-neutro-100 disabled:text-neutro-500"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-2.5 size-4 text-neutro-400" aria-hidden="true" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reserva-hora-inicio" className="block text-xs font-semibold text-neutro-700 mb-1">
                    {t.horaInicioLabel}
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      id="reserva-hora-inicio"
                      name="horaInicio"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      required
                      disabled={!isCliente || createMutation.isPending}
                      className="w-full rounded-md border border-neutro-300 px-3 py-2 text-sm text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500 disabled:bg-neutro-100 disabled:text-neutro-500"
                    />
                    <Clock className="pointer-events-none absolute right-3 top-2.5 size-4 text-neutro-400" aria-hidden="true" />
                  </div>
                </div>

                <div>
                  <label htmlFor="reserva-hora-fin" className="block text-xs font-semibold text-neutro-700 mb-1">
                    {t.horaFinLabel}
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      id="reserva-hora-fin"
                      name="horaFin"
                      value={horaFin}
                      onChange={(e) => setHoraFin(e.target.value)}
                      required
                      disabled={!isCliente || createMutation.isPending}
                      className="w-full rounded-md border border-neutro-300 px-3 py-2 text-sm text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500 disabled:bg-neutro-100 disabled:text-neutro-500"
                    />
                    <Clock className="pointer-events-none absolute right-3 top-2.5 size-4 text-neutro-400" aria-hidden="true" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="reserva-mobiliario" className="block text-xs font-semibold text-neutro-700 mb-1">
                  {t.mobiliarioLabel}
                </label>
                <input
                  type="text"
                  id="reserva-mobiliario"
                  name="mobiliario"
                  maxLength={30}
                  placeholder={t.mobiliarioPlaceholder}
                  value={mobiliario}
                  onChange={(e) => setMobiliario(e.target.value)}
                  disabled={!isCliente || createMutation.isPending}
                  className="w-full rounded-md border border-neutro-300 px-3 py-2 text-sm text-neutro-900 focus:border-bronce-500 focus:outline-none focus:ring-1 focus:ring-bronce-500 disabled:bg-neutro-100 disabled:text-neutro-500"
                />
              </div>

              <div className="mt-4 flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCerrar}
                  disabled={createMutation.isPending}
                >
                  {t.cerrar}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={createMutation.isPending}
                  disabled={!isCliente || createMutation.isPending}
                >
                  {createMutation.isPending ? t.confirmando : t.confirmarReserva}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
