import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { AuthPageLayout } from '@/components/shared/AuthPageLayout';
import { Alert } from '@/components/ui/Feedback';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/AuthContext';
import { getPostLoginRoute } from '@/features/auth/routing';
import { es } from '@/i18n/es';

export const LoginPage: React.FC = () => {
  const { status, user, notice } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: unknown } | null)?.from;

  if (status === 'authenticated' && user) {
    return <Navigate to={getPostLoginRoute(user, from)} replace />;
  }

  return (
    <AuthPageLayout
      title={es.auth.loginTitulo}
      description={es.auth.loginDescripcion}
      footer={
        <>
          {es.auth.sinCuenta}{' '}
          <Link
            to="/registro"
            state={location.state}
            className="inline-flex min-h-11 items-center font-semibold text-bronce-700 underline-offset-2 hover:underline"
          >
            {es.auth.registrarse}
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {notice && <Alert tone="warning">{notice}</Alert>}
        <LoginForm />
      </div>
    </AuthPageLayout>
  );
};
