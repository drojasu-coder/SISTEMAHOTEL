import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { useLocale } from '@/i18n/LocaleContext';
import { Button } from '@/components/ui/Button';
import { createBusquedaReservaSchema, getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { usePublicInterface } from '@/i18n/public';
import { StayDateRange } from '@/features/habitaciones/public/StayDateRange';
import { GuestCount } from '@/features/habitaciones/public/GuestCount';
import { readStayDraft, saveStayDraft } from '@/features/habitaciones/public/stayDraft';
import { calendarDateKey, parseCalendarDate } from '@/lib/dates';

const getTodayFormatted = getTodayInGuatemala;
function getTomorrowFormatted(): string {
  const tomorrow = parseCalendarDate(getTodayInGuatemala())!;
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return calendarDateKey(tomorrow);
}

export const BuscadorDisponibilidad: React.FC = () => {
  const navigate = useNavigate();
  const { selected, status, sites, openSelection, selectionOpen } = usePublicPreferences();
  const site = typeof selected === 'number' ? sites.find((s) => s.id === selected) : undefined;
  const { t, locale } = useLocale();
  const { p } = usePublicInterface();

  const [saved] = useState(readStayDraft);
  const [fechaEntrada, setFechaEntrada] = useState<string>(saved.fecha_entrada ?? getTodayFormatted());
  const [fechaSalida, setFechaSalida] = useState<string>(saved.fecha_salida ?? getTomorrowFormatted());
  const [numeroHuespedes, setNumeroHuespedes] = useState<string>(saved.numero_huespedes ?? '2');
  const [submitted, setSubmitted] = useState(false);
  const validation = createBusquedaReservaSchema(p).safeParse({
    sucursal_id: status === 'ready' && typeof selected === 'number' ? String(selected) : '',
    fecha_entrada: fechaEntrada,
    fecha_salida: fechaSalida,
    numero_huespedes: numeroHuespedes,
  });
  const errors = submitted && !validation.success ? validation.error.flatten().fieldErrors : {};

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!validation.success) return;
    saveStayDraft(validation.data);
    const params = new URLSearchParams({
      sucursal_id: validation.data.sucursal_id,
      fecha_entrada: validation.data.fecha_entrada,
      fecha_salida: validation.data.fecha_salida,
      numero_huespedes: validation.data.numero_huespedes,
    });
    navigate(`/reservar?${params}`);
  };

  return (
    <div lang={locale} className="relative z-20 mx-auto -mt-10 w-full max-w-5xl px-4 sm:px-6">
      <div className="rounded-2xl border border-neutro-200 bg-white p-5 shadow-xl md:p-6">
        <form noValidate onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Campo Sede */}
            {/* La sede es la del encabezado: aquí solo se muestra y se cambia con el mismo selector global. */}
            <div className="min-w-0 text-xs">
              <p id="home-search-sede-label" className="text-xs font-semibold uppercase tracking-wider text-neutro-700">{t('site')}</p>
              <button type="button" id="home-search-sede" aria-haspopup="dialog" aria-expanded={selectionOpen}
                aria-label={`${t('site')}: ${site?.nombre ?? t(status === 'loading' ? 'loadingSite' : 'chooseSite')}. ${t('changeSite')}`}
                aria-invalid={Boolean(errors.sucursal_id?.[0])} aria-describedby={errors.sucursal_id?.[0] ? 'home-search-sede-error' : undefined}
                onClick={(event) => openSelection(event.currentTarget)}
                className="mt-1 flex h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-neutro-300 bg-neutro-50 px-3 text-left text-sm text-neutro-900 transition-colors hover:border-bronce-500 focus:border-bronce-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-bronce-500 aria-[invalid=true]:border-error-600">
                <MapPin className="size-4 shrink-0 text-bronce-700" aria-hidden="true" />
                <span lang={site ? 'es' : locale} className="min-w-0 flex-1 truncate">{site?.short ?? t(status === 'loading' ? 'loadingSite' : 'chooseSite')}</span>
                <ChevronDown className="size-4 shrink-0 text-bronce-700" aria-hidden="true" />
              </button>
              {errors.sucursal_id?.[0] && <p id="home-search-sede-error" role="alert" className="mt-1 text-xs text-error-600">{errors.sucursal_id[0]}</p>}
            </div>

            <div className="sm:col-span-2">
              <StayDateRange value={{ fecha_entrada: fechaEntrada, fecha_salida: fechaSalida }}
                arrivalError={errors.fecha_entrada?.[0]} departureError={errors.fecha_salida?.[0]}
                onChange={(range) => {
                  setFechaEntrada(range.fecha_entrada); setFechaSalida(range.fecha_salida);
                  saveStayDraft({ ...range, numero_huespedes: numeroHuespedes });
                }} />
            </div>
            <GuestCount label={t('guests')} value={numeroHuespedes} error={errors.numero_huespedes?.[0]} onChange={(value) => {
              setNumeroHuespedes(value);
              saveStayDraft({ fecha_entrada: fechaEntrada, fecha_salida: fechaSalida, numero_huespedes: value });
            }} />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto font-semibold px-6 py-2.5 shadow-md flex items-center justify-center gap-2"
            >
              <Search className="size-4" aria-hidden="true" />
              <span>{t('consultRooms')}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
