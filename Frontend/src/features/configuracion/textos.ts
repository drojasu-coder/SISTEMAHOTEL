import { useLocale } from '@/i18n/LocaleContext';

/** Textos de la página de parámetros generales (ES/EN). */
const es = {
  categoria: 'Configuración', titulo: 'Parámetros generales', intro: 'Valores globales que aplica el sistema. Se muestran solo para consulta.',
  cargando: 'Consultando parámetros…', error: 'No fue posible consultar este parámetro.', reintentar: 'Reintentar', actualizado: 'Última actualización',
  impuestos: 'Impuestos', iva: 'IVA', ivaNota: 'Se aplica a las facturas nuevas. Cada factura conserva el porcentaje con que fue creada y los precios ya registrados no se recalculan.',
  restaurante: 'Reservas de restaurante', apertura: 'Apertura', cierre: 'Cierre', ultimoInicio: 'Última hora de inicio', intervalo: 'Intervalo entre reservas', duracion: 'Duración de cada reserva',
  minutos: (n: number) => `${n} min`, restauranteNota: 'Hora local de Guatemala. Aplica a todas las sedes.',
  soloLectura: 'Solo consulta', administrado: 'Otros ajustes se gestionan en su propio módulo: sedes, contenido del sitio e identidad visual.',
};
const en: typeof es = {
  categoria: 'Configuration', titulo: 'General settings', intro: 'Global values applied by the system. Shown for reference only.',
  cargando: 'Loading settings…', error: 'This setting could not be loaded.', reintentar: 'Retry', actualizado: 'Last updated',
  impuestos: 'Taxes', iva: 'VAT', ivaNota: 'Applied to new invoices. Each invoice keeps the rate it was created with, and recorded prices are not recalculated.',
  restaurante: 'Restaurant reservations', apertura: 'Opening', cierre: 'Closing', ultimoInicio: 'Last start time', intervalo: 'Interval between reservations', duracion: 'Length of each reservation',
  minutos: (n: number) => `${n} min`, restauranteNota: 'Guatemala local time. Applies to all sites.',
  soloLectura: 'Read only', administrado: 'Other settings are managed in their own module: sites, site content and visual identity.',
};
export const useTextosConfig = () => { const { locale } = useLocale(); return locale === 'en' ? en : es; };
