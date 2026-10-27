import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Brand } from '@/components/shared/Brand';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/features/auth/AuthContext';
import { canAccessPanel } from '@/features/auth/permissions';
import { useLocale } from '@/i18n/LocaleContext';
import { PublicCartLink } from './PublicCartLink';
import { primaryLinks, sectionActive } from './publicNavigation';
import { PublicDropdown } from './PublicDropdown';

const itemClass = 'flex min-h-11 items-center rounded-md px-2 text-xs font-semibold hover:bg-bronce-50 hover:text-bronce-700';
export const Navbar: React.FC = () => {
  const { status, user, logout } = useAuth();
  const { t, locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { setMobile(false); }, [location]);
  useEffect(() => {
    if (!mobile) return;
    const root = document.getElementById('root');
    const inert = root?.inert;
    if (root) root.inert = true;
    const media = window.matchMedia?.('(min-width: 1280px)');
    const close = () => { if (media?.matches) setMobile(false); };
    media?.addEventListener('change', close);
    return () => {
      if (root) root.inert = inert ?? false;
      media?.removeEventListener('change', close);
      mobileTrigger.current?.focus({ preventScroll: true });
    };
  }, [mobile]);
  const account = status === 'authenticated' && user ? <>
    {user.rol === 'cliente' && <Link className={itemClass} to="/mis-reservas">{t('reservations')}</Link>}
    <Link className={itemClass} to="/cuenta">{t('account')}</Link>
    {canAccessPanel(user.rol) && <Link className={itemClass} to="/admin">{t('panel')}</Link>}
    <button type="button" className={itemClass} onClick={() => { logout(); setMobile(false); navigate('/', { replace: true }); }}>{t('logout')}</button>
  </> : status === 'anonymous' ? <><Link className={itemClass} to="/login">{t('login')}</Link><Link className={`${itemClass} bg-bronce-600 text-white`} to="/registro">{t('register')}</Link></> : null;
  const cart = <PublicCartLink />;
  const links = (phone = false) => primaryLinks.map((link) => link.children ? phone ? <details key={link.label}>
    <summary className={itemClass}>{t(link.label)}</summary><div className="ml-4">{link.children.map((child) => navLink(child))}</div>
  </details> : <PublicDropdown key={link.label} label={t(link.label)} active={link.children.some((c) => sectionActive(location.pathname, c.to))}>{link.children.map((child) => navLink(child))}</PublicDropdown> : navLink(link));
  const navLink = (link: { to: string; label: Parameters<typeof t>[0] }) => <Link key={link.label} className={itemClass} aria-current={sectionActive(location.pathname, link.to) ? 'page' : undefined} to={link.to}>{t(link.label)}</Link>;
  return <>
    <header lang={locale} className="sticky top-0 z-40 border-b bg-white">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="min-w-0 shrink-0 rounded-md" aria-label={`HOTEL HUNAHPÚ · ${t('home')}`}><Brand className="max-w-[135px] [&>span:first-child]:text-sm sm:max-w-[170px] sm:[&>span:first-child]:text-base" /></Link>
        <nav className="hidden items-center gap-1 xl:flex" aria-label={t('navigation')}>{links()}</nav>
        <div className="ml-auto flex items-center gap-2">{cart}<div className="hidden items-center gap-2 xl:flex">
          {status === 'authenticated' && user ? <PublicDropdown label={user.nombre}>{account}</PublicDropdown> : account}
        </div>
        <button ref={mobileTrigger} type="button" aria-label={t('openMenu')} aria-expanded={mobile} aria-haspopup="dialog" className="flex size-11 shrink-0 items-center justify-center rounded-md border xl:hidden" onClick={() => {
          if (!document.querySelector('[role="dialog"][aria-modal="true"], dialog[open]')) setMobile(true);
        }}><Menu aria-hidden="true" /></button></div>
      </div>
    </header>
    {mobile && createPortal(<div lang={locale} className="public-mobile-menu"><Modal open={mobile} title={t('navigation')} closeLabel={t('closeMenu')} onClose={() => setMobile(false)} className="h-[100dvh] !max-h-none !max-w-none !rounded-none">
      <nav className="mt-5 flex flex-col gap-1" aria-label={t('navigation')}>{links(true)}</nav>
      <div className="mt-5 border-t pt-3">{user && <p className="px-2 font-semibold">{user.nombre}</p>}{account}</div>
    </Modal></div>, document.body)}
  </>;
};
