import React from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_ORDER, LEGAL_ROUTES } from './routes';
import { useLegalDocuments } from './useLegalDocuments';

/** Lista de enlaces a los documentos legales (pie de página público). */
export const LegalLinks: React.FC<{ className?: string; linkClassName?: string }> = ({ className, linkClassName }) => {
  const { docs, ui } = useLegalDocuments();
  return (
    <nav aria-label={ui.footerTitle} className={className}>
      <ul className="flex flex-wrap gap-x-5 gap-y-1">
        {LEGAL_ORDER.map((slug) => (
          <li key={slug}>
            <Link to={LEGAL_ROUTES[slug]} className={linkClassName}>{docs[slug].title}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
