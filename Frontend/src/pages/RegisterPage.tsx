import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthPageLayout } from '@/components/shared/AuthPageLayout';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { useAuth } from '@/features/auth/AuthContext';
import { getPostLoginRoute } from '@/features/auth/routing';
import { useAuthReturn } from '@/features/auth/useAuthReturn';
import { usePublicTexts } from '@/i18n/public';

export const RegisterPage: React.FC = () => {
  const auth = usePublicTexts('auth');
  const { status, user } = useAuth();
  const context = useAuthReturn();
  const { from } = context;

  if (status === 'authenticated' && user) {
    return <Navigate to={getPostLoginRoute(user, from)} replace />;
  }

  return (
    <AuthPageLayout
      draft={Boolean(context.draft)}
      title={auth.registroTitulo}
      description={auth.registroDescripcion}
      footer={
        <>
          {auth.conCuenta}{' '}
          <Link
            to="/login"
            state={context.state}
            className="inline-flex min-h-11 items-center font-semibold text-bronce-700 underline-offset-2 hover:underline"
          >
            {auth.loginTitulo}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthPageLayout>
  );
};
