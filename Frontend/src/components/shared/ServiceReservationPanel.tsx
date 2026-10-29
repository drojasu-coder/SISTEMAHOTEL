import type { ComponentProps, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Modal, type ModalProps } from '@/components/ui/Modal';
import { Button, buttonStyles } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';
import { ServiceMedia } from './ServiceCard';
import { usePublicPreferences } from '@/features/preferencias/PublicPreferences';
import { usePublicInterface } from '@/i18n/public';
import { useAuth } from '@/features/auth/AuthContext';
import { safeReturnPath } from '@/features/auth/secureReturn';
import type { ServiceKind } from '@/features/auth/serviceDraft';

/** Solo composición visual. Cada servicio conserva su formulario y su contrato. */
export function ServiceReservationPanel({ name, siteId, siteName, media, children, details, compact = false, ...modal }: ModalProps & {
  name: ReactNode; siteId?: number; siteName?: string; media: ComponentProps<typeof ServiceMedia>;
  /** Datos breves del recurso bajo el nombre (p. ej. zona y capacidad). */
  details?: ReactNode;
  /** Oculta los avisos generales del lateral cuando el formulario ya los resume. */
  compact?: boolean;
}) {
  const { sites } = usePublicPreferences();
  const { p } = usePublicInterface();
  const site = sites.find((item) => item.id === siteId)?.nombre || siteName;
  return <Modal {...modal} presentation="service">
    <div className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-8">
      <aside className="min-w-0 space-y-4">
        {/* Sin imagen alojada en S3 no se muestra un recuadro vacío: el nombre y la sede bastan. */}
        {media.src && <div className="overflow-hidden rounded-lg border border-neutro-200"><ServiceMedia {...media} /></div>}
        <h3 className="font-serif text-xl font-semibold" lang="es">{name}</h3>
        {siteId ? <p className="text-sm text-bronce-700">{p('siteLabel')} <span lang="es">{site || `#${siteId}`}</span></p> : <p className="text-sm text-neutro-600">{p('serviceGeneralCatalog')}</p>}
        {details}
        {!compact && <p className="text-sm text-neutro-600">{p('serviceAvailabilityNotice')}</p>}
        {!compact && <p className="text-xs text-neutro-500">{p('serviceTimezone')}</p>}
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  </Modal>;
}

export function ServiceAuthNotice({ kind, resourceId, allowAuthenticated = false, anonymousMessage }: { kind: ServiceKind; resourceId: number; allowAuthenticated?: boolean; anonymousMessage?: string }) {
  const { status, user } = useAuth();
  const location = useLocation();
  const { p } = usePublicInterface();
  if (status === 'authenticated' && (allowAuthenticated || user?.rol === 'cliente')) return null;
  const params = new URLSearchParams(location.search);
  params.set('recurso', String(resourceId));
  const pathname = location.pathname === `/${kind}` || (kind === 'eventos' && /^\/eventos\/salones\/[1-9]\d*$/.test(location.pathname)) ? location.pathname : `/${kind}`;
  const from = safeReturnPath(`${pathname}?${params}`);
  return <Alert tone="info"><p>{status === 'authenticated' ? p('serviceCustomerOnly') : anonymousMessage ?? p('authReservationDraft')}</p>
    {status !== 'authenticated' && status !== 'loading' && <Link to="/login" state={{ from }} className={buttonStyles({ variant: 'secondary', className: 'mt-3' })}>{p('signIn')}</Link>}
  </Alert>;
}

export function MissingServiceSelection({ onClose }: { onClose: () => void }) {
  const { p } = usePublicInterface();
  return <Alert tone="warning" title={p('serviceResourceMissing')}><Button variant="ghost" onClick={onClose}>{p('serviceReturnCatalog')}</Button></Alert>;
}
