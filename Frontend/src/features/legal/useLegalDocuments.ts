import { useLocale } from '@/i18n/LocaleContext';
import { legalEn } from './content.en';
import { legalEs } from './content.es';

/** Textos fijos de las páginas legales (no del contenido de cada documento). */
const ui = {
  es: {
    eyebrow: 'Información legal',
    updated: 'Última actualización',
    contents: 'En esta página',
    related: 'Otros documentos',
    footerTitle: 'Información legal',
    academicTitle: 'Proyecto académico',
    academic:
      'HOTEL HUNAHPÚ es un proyecto universitario de gestión hotelera. No es una empresa registrada ni un establecimiento inscrito ante el INGUAT, y los pagos con Stripe funcionan en modo de prueba, sin cargos reales.',
    backToTop: 'Volver al inicio de la página',
  },
  en: {
    eyebrow: 'Legal information',
    updated: 'Last updated',
    contents: 'On this page',
    related: 'Other documents',
    footerTitle: 'Legal information',
    academicTitle: 'Academic project',
    academic:
      'HOTEL HUNAHPÚ is a university hotel-management project. It is not a registered company or an INGUAT-registered establishment, and Stripe payments run in test mode, without real charges.',
    backToTop: 'Back to top of page',
  },
} as const;

export function useLegalDocuments() {
  const { locale } = useLocale();
  const en = locale === 'en';
  return { locale, docs: en ? legalEn : legalEs, ui: en ? ui.en : ui.es };
}
