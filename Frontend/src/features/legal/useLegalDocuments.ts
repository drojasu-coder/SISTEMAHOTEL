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
    backToTop: 'Volver al inicio de la página',
  },
  en: {
    eyebrow: 'Legal information',
    updated: 'Last updated',
    contents: 'On this page',
    related: 'Other documents',
    footerTitle: 'Legal information',
    backToTop: 'Back to top of page',
  },
} as const;

export function useLegalDocuments() {
  const { locale } = useLocale();
  const en = locale === 'en';
  return { locale, docs: en ? legalEn : legalEs, ui: en ? ui.en : ui.es };
}
