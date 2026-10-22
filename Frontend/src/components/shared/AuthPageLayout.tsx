import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { es } from '@/i18n/es';

interface AuthPageLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/** Estructura común de las pantallas de acceso (inicio de sesión y registro). */
export const AuthPageLayout: React.FC<AuthPageLayoutProps> = ({
  title,
  description,
  children,
  footer,
}) => (
  <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 sm:py-14">
    <div className="flex flex-col gap-3 text-center">
      <Link
        to="/"
        className="inline-flex min-h-11 items-center justify-center gap-2 text-xs font-medium text-neutro-600 hover:text-bronce-700"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {es.auth.volverPrincipal}
      </Link>
      <h1 className="text-[2rem] leading-[2.375rem] md:text-[2.5rem] md:leading-[3rem]">{title}</h1>
      <p className="text-sm text-neutro-600">{description}</p>
    </div>

    <Card className="p-5 sm:p-8">{children}</Card>

    <p className="text-center text-xs text-neutro-600">{footer}</p>
  </div>
);
