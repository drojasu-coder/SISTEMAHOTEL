import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brand } from './Brand';
import { Drawer } from '@/components/ui/Drawer';
import { Popover } from '@/components/ui/Popover';
import { Icon, type IconName } from '@/components/ui/Icon';
import { buttonStyles } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { canAccessPanel } from '@/features/auth/permissions';
import { MI_VIAJE_ROUTE } from '@/features/mi-viaje/routes';
import { useLocale } from '@/i18n/LocaleContext';
import { PublicCartLink } from './PublicCartLink';
import { primaryLinks, sectionActive } from './publicNavigation';
import { HeaderPreferences, HeaderSitePicker } from './HeaderPreferences';
import type { UxKey } from '@/i18n/ux';
const experienceDetails: Record<string, { icon: IconName; description: UxKey }> = {
  amenities: { icon: 'amenidad', description: 'amenitiesDescription' },
  activities: { icon: 'actividad', description: 'activitiesDescription' },
  wellness: { icon: 'bienestar', description: 'wellnessDescription' },
  events: { icon: 'evento', description: 'eventsDescription' },
};
export function Navbar() {
  const { status, user, logout } = useAuth();
  const { t, locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { setMobile(false); }, [location]);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 8);
    scroll(); window.addEventListener('scroll', scroll, { passive: true });
    return () => window.removeEventListener('scroll', scroll);
  }, []);
  useEffect(() => {
    if (!mobile) return;
    const root = document.getElementById('root');
    const inert = root?.inert;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (root) root.inert = true;
    const media = window.matchMedia('(min-width: 1024px)');
    const close = () => { if (media.matches) setMobile(false); };
    media.addEventListener('change', close);
    return () => {
      if (root) root.inert = inert ?? false;
      document.body.style.overflow = overflow;
      media.removeEventListener('change', close);
      mobileTrigger.current?.focus({ preventScroll: true });
    };
  }, [mobile]);
  const authenticated = status === 'authenticated' && user;
  const initials = user?.nombre.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const account = (menu = false) => authenticated ? <>
    <div className="mb-2 border-b border-neutro-200 px-3 py-3"><p className="break-words font-semibold">{user.nombre}</p><p className="break-all text-xs text-neutro-600">{user.email}</p></div>
    <Link role={menu ? 'menuitem' : undefined} className="header-option" to="/cuenta"><Icon name="persona" />{t('profile')}</Link>
    {user.rol === 'cliente' && <Link role={menu ? 'menuitem' : undefined} className="header-option" to="/mis-reservas"><Icon name="calendario" />{t('reservations')}</Link>}
    {user.rol === 'cliente' && <Link role={menu ? 'menuitem' : undefined} className="header-option" aria-current={location.pathname === MI_VIAJE_ROUTE ? 'page' : undefined} to={MI_VIAJE_ROUTE}><Icon name="viaje" />{t('myTrip')}</Link>}
    {canAccessPanel(user.rol) && <Link role={menu ? 'menuitem' : undefined} className="header-option" to="/admin"><Icon name="panel" />{t('panel')}</Link>}
    <div role="separator" className="my-2 border-t border-neutro-200" />
    <button role={menu ? 'menuitem' : undefined} className="header-option" onClick={() => { logout(); setMobile(false); navigate('/', { replace: true }); }}><Icon name="salir" />{t('logout')}</button>
  </> : status === 'anonymous' ? <div className="header-auth flex flex-wrap gap-3"><Link className={buttonStyles({ variant: 'text' })} to="/login">{t('login')}</Link><Link className={buttonStyles()} to="/registro">{t('register')}</Link></div> : null;
  const navLink = (link: { to: string; label: UxKey }, menu = false) => {
    const detail = menu ? experienceDetails[link.label] : undefined;
    return <Link key={link.label} role={menu ? 'menuitem' : undefined} className={menu ? 'header-option' : 'header-control'} aria-current={sectionActive(location.pathname, link.to) ? 'page' : undefined} to={link.to}>
      {detail && <Icon name={detail.icon} className="text-bronce-700" />}<span>{t(link.label)}{detail && <span className="mt-1 block text-xs font-normal text-neutro-600">{t(detail.description)}</span>}</span>
    </Link>;
  };
  const links = (phone = false) => primaryLinks.map(link => link.children ? phone ? <div key={link.label}><p className="px-3 pb-2 pt-4 text-xs font-semibold text-neutro-600">{t(link.label)}</p>{link.children.map(child => navLink(child))}</div> : <Popover key={link.label} label={t(link.label)} triggerClassName={link.children.some(c => sectionActive(location.pathname, c.to)) ? 'bg-bronce-50 text-bronce-800' : ''}>{link.children.map(child => navLink(child, true))}</Popover> : navLink(link));
  return <>
    <header lang={locale} className={`public-header sticky top-0 z-40 border-b border-neutro-200 bg-white transition-shadow duration-200 ${scrolled ? 'shadow-soft' : ''}`}>
      <div className="header-row mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="header-identity flex min-w-0 items-center gap-2 xl:gap-3">
          <Link to="/" className="header-logo flex min-h-11 shrink-0 items-center rounded-md" aria-label={t('home')}><Brand className="!h-8 !w-auto object-contain md:!h-10 xl:!h-12" /></Link>
          <span aria-hidden="true" className="h-6 shrink-0 border-l border-neutro-200" />
          <HeaderSitePicker compact />
        </div>
        <nav className="header-nav hidden shrink-0 items-center lg:flex" aria-label={t('navigation')}>{links()}</nav>
        <div className="header-actions flex shrink-0 items-center gap-2 xl:gap-3">
          <div className="hidden lg:block"><HeaderPreferences iconOnly /></div>
          <PublicCartLink />
          <Link to="/reservar" className={buttonStyles({ size: 'sm', className: 'header-reserve hidden gap-2 sm:inline-flex' })}><Icon name="calendario" className="size-4" /><span>{t('reserve')}</span></Link>
          <div className="header-account ml-2 hidden lg:block xl:ml-3">
            {authenticated ? <Popover label={`${t('account')}: ${user.nombre}`} triggerClassName="gap-2 px-1" trigger={<><span className="flex size-10 items-center justify-center rounded-full bg-bronce-100 font-semibold text-bronce-800">{initials}</span><span className="max-w-16 truncate xl:max-w-28">{user.nombre}</span></>}>{account(true)}</Popover> : account()}
          </div>
          <button ref={mobileTrigger} type="button" aria-label={t('openMenu')} aria-expanded={mobile} aria-haspopup="dialog" className="header-control !px-3 lg:hidden" onClick={() => setMobile(true)}><Icon name="menu" /></button>
        </div>
      </div>
    </header>
    {mobile && createPortal(<div lang={locale} className="public-mobile-menu"><Drawer open={mobile} title={t('navigation')} closeLabel={t('closeMenu')} onClose={() => setMobile(false)} className="!max-w-sm"><div className="flex flex-col gap-5"><nav className="flex flex-col gap-1 border-t border-neutro-200 pt-4" aria-label={t('navigation')}>{links(true)}</nav><Link to="/reservar" className={buttonStyles({ className: 'w-full justify-center gap-2' })}><Icon name="calendario" className="size-4" />{t('reserve')}</Link><HeaderPreferences /><div className="border-t border-neutro-200 pt-3">{account()}</div></div></Drawer></div>, document.body)}
  </>;
}
