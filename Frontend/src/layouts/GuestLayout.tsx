import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';

export const GuestLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-charcoal-900">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
