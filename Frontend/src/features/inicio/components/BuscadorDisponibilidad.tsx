import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Search, AlertCircle } from 'lucide-react';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { SiteSelector } from '@/features/preferencias/SiteSelector';
import { useLocale } from '@/i18n/LocaleContext';
import { Button } from '@/components/ui/Button';
import { getTodayInGuatemala } from '@/features/crear-reserva/schemas/busquedaReservaSchema';
import { calendarDateKey, parseCalendarDate } from '@/lib/dates';

const getTodayFormatted = getTodayInGuatemala;
function getTomorrowFormatted(): string {
  const tomorrow = parseCalendarDate(getTodayInGuatemala())!;
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return calendarDateKey(tomorrow);
}

export const BuscadorDisponibilidad: React.FC = () => {
  const navigate = useNavigate();
  const { selected, status } = usePublicPreferences();
  const { t, locale } = useLocale();

  const [fechaEntrada, setFechaEntrada] = useState<string>(getTodayFormatted());
  const [fechaSalida, setFechaSalida] = useState<string>(getTomorrowFormatted());
  const [numeroHuespedes, setNumeroHuespedes] = useState<string>('2');
  const [errorMsg, setErrorMsg] = useState<'requiredSite' | 'datesRequired' | 'datesOrder' | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (status !== 'ready') {
      setErrorMsg('requiredSite');
      return;
    }

    if (!fechaEntrada || !fechaSalida) {
      setErrorMsg('datesRequired');
      return;
    }

    if (fechaSalida <= fechaEntrada) {
      setErrorMsg('datesOrder');
      return;
    }

    const params = new URLSearchParams({
      sede: String(selected),
      buscar: '1',
      fecha_entrada: fechaEntrada,
      fecha_salida: fechaSalida,
      numero_huespedes: numeroHuespedes || '1',
    });

    navigate(`/habitaciones?${params.toString()}`);
  };

  return (
    <div lang={locale} className="relative z-20 mx-auto -mt-10 w-full max-w-5xl px-4 sm:px-6">
      <div className="rounded-2xl border border-neutro-200 bg-white p-5 shadow-xl md:p-6">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Campo Sede */}
            <SiteSelector id="home-search-sede" labelClassName="text-xs font-semibold uppercase tracking-wider text-neutro-700" className="h-11 rounded-lg border border-neutro-300 bg-neutro-50 px-3 text-sm text-neutro-900 focus:border-bronce-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-bronce-500 transition-colors" />

            {/* Campo Fecha Entrada */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="home-search-entrada"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutro-700"
              >
                <Calendar className="size-3.5 text-bronce-600" aria-hidden="true" />
                <span>{t('arrival')}</span>
              </label>
              <input
                type="date"
                id="home-search-entrada"
                value={fechaEntrada}
                min={getTodayFormatted()}
                onChange={(e) => {
                  setFechaEntrada(e.target.value);
                  setErrorMsg(null);
                }}
                className="h-11 rounded-lg border border-neutro-300 bg-neutro-50 px-3 text-sm text-neutro-900 focus:border-bronce-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-bronce-500 transition-colors"
                required
              />
            </div>

            {/* Campo Fecha Salida */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="home-search-salida"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutro-700"
              >
                <Calendar className="size-3.5 text-bronce-600" aria-hidden="true" />
                <span>{t('departure')}</span>
              </label>
              <input
                type="date"
                id="home-search-salida"
                value={fechaSalida}
                min={fechaEntrada || getTodayFormatted()}
                onChange={(e) => {
                  setFechaSalida(e.target.value);
                  setErrorMsg(null);
                }}
                className="h-11 rounded-lg border border-neutro-300 bg-neutro-50 px-3 text-sm text-neutro-900 focus:border-bronce-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-bronce-500 transition-colors"
                required
              />
            </div>

            {/* Campo Huéspedes */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="home-search-huespedes"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutro-700"
              >
                <Users className="size-3.5 text-bronce-600" aria-hidden="true" />
                <span>{t('guests')}</span>
              </label>
              <select
                id="home-search-huespedes"
                value={numeroHuespedes}
                onChange={(e) => setNumeroHuespedes(e.target.value)}
                className="h-11 rounded-lg border border-neutro-300 bg-neutro-50 px-3 text-sm text-neutro-900 focus:border-bronce-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-bronce-500 transition-colors"
              >
                <option value="1">1 {t('guest')}</option>
                <option value="2">2 {t('guests')}</option>
                <option value="3">3 {t('guests')}</option>
                <option value="4">4 {t('guests')}</option>
                <option value="5">5 {t('guests')}</option>
                <option value="6">6 {t('guests')}</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs font-medium text-red-600">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              <span role="alert">{t(errorMsg)}</span>
            </div>
          )}

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
