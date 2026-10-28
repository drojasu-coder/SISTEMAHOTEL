import React from 'react';
import { Link } from 'react-router-dom';
import { LEGAL_ROUTES } from './routes';
import { useLegalDocuments } from './useLegalDocuments';

/**
 * Aviso informativo con enlaces a los documentos que rigen una reserva o un pago.
 * No es una casilla de aceptación y el sistema no registra que se haya leído.
 */
export const LegalNotice: React.FC<{ className?: string }> = ({ className }) => {
  const { locale, docs } = useLegalDocuments();
  const link = (slug: 'terminos' | 'privacidad' | 'reservas') => (
    <Link to={LEGAL_ROUTES[slug]} className="font-medium text-bronce-700 underline hover:text-bronce-900">{docs[slug].title}</Link>
  );
  return (
    <p className={className ?? 'text-xs leading-relaxed text-neutro-600'}>
      {locale === 'en' ? 'Before continuing, please review the ' : 'Antes de continuar, consulte los '}
      {link('terminos')}
      {locale === 'en' ? ', the ' : ', la '}
      {link('privacidad')}
      {locale === 'en' ? ' and the ' : ' y la política de '}
      {link('reservas')}
      {'.'}
    </p>
  );
};
