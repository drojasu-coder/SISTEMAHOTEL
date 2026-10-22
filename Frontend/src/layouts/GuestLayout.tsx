import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { es } from '@/i18n/es';

export const GuestLayout: React.FC = () => (
  <div className="flex min-h-screen flex-col bg-neutro-50 text-neutro-900">
    <a href="#contenido" className="skip-link">
      {es.comunes.saltarAlContenido}
    </a>
    <Navbar />
    <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
      <Outlet />
    </main>
    <Footer />
  </div>
);
