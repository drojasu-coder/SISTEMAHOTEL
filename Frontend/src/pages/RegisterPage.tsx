import React from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { AuthPageLayout } from '@/components/shared/AuthPageLayout';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { useAuth } from '@/features/auth/AuthContext';
import { getPostLoginRoute } from '@/features/auth/routing';
import { es } from '@/i18n/es';

export const RegisterPage: React.FC = () => {
  const { status, user } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: unknown } | null)?.from;

  if (status === 'authenticated' && user) {
    return <Navigate to={getPostLoginRoute(user, from)} replace />;
  }

  return (
    <AuthPageLayout
      title={es.auth.registroTitulo}
      description={es.auth.registroDescripcion}
      footer={
        <>
          {es.auth.conCuenta}{' '}
          <Link
            to="/login"
            state={location.state}
            className="inline-flex min-h-11 items-center font-semibold text-bronce-700 underline-offset-2 hover:underline"
          >
            {es.auth.loginTitulo}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthPageLayout>
  );
};
