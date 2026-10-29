import { Route } from 'react-router-dom';
import { LegalDocumentPage } from './LegalDocumentPage';
import { LEGAL_ORDER, LEGAL_ROUTES } from './routes';

/**
 * Rutas públicas de los documentos legales. Se insertan dentro del layout
 * público para que compartan encabezado y pie de página.
 */
export const legalRoutes = () =>
  <>
    {LEGAL_ORDER.map((slug) => (
      <Route key={slug} path={LEGAL_ROUTES[slug]} element={<LegalDocumentPage slug={slug} />} />
    ))}
    <Route path="/legal/terminos-y-condiciones" element={<LegalDocumentPage slug="terminos" />} />
    <Route path="/legal/privacidad" element={<LegalDocumentPage slug="privacidad" />} />
  </>;
