import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { useLocale } from '@/i18n/LocaleContext';
import { PublicPreferencesProvider } from '@/features/preferencias/PublicPreferences';
import { FirstVisit } from '@/features/preferencias/FirstVisit';

export const GuestLayout: React.FC = () => {
 const { t, locale } = useLocale();
 const { pathname } = useLocation();
 const authPage = pathname === '/login' || pathname === '/registro';
 const privateRegion = /^\/(mis-reservas|carrito|checkout|pagos|cuenta)(\/|$)/.test(pathname);
 return <PublicPreferencesProvider>
  <div className="flex min-h-screen flex-col bg-neutro-50 text-neutro-900">
    <a href="#contenido" className="skip-link">
      {t('skip')}
    </a>
    {!authPage && <><Navbar /><FirstVisit /></>}
    <main lang={privateRegion && !/^\/(carrito|checkout|pagos)(\/|$)/.test(pathname) ? 'es' : locale} id="contenido" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
      <Outlet />
    </main>
    {!authPage && <Footer />}
  </div></PublicPreferencesProvider>;
};
