import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthPageLayout } from '@/components/shared/AuthPageLayout';
import { Alert } from '@/components/ui/Feedback';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/features/auth/AuthContext';
import { getPostLoginRoute } from '@/features/auth/routing';
import { useAuthReturn } from '@/features/auth/useAuthReturn';
import { usePublicTexts, usePublicInterface } from '@/i18n/public';

export const LoginPage: React.FC = () => {
  const auth = usePublicTexts('auth');
  const { p } = usePublicInterface();
  const { status, user, notice, noticeReason } = useAuth();
  const context = useAuthReturn();
  const { from } = context;

  if (status === 'authenticated' && user) {
    return <Navigate to={getPostLoginRoute(user, from)} replace />;
  }

  return (
    <AuthPageLayout
      draft={Boolean(context.draft)}
      title={auth.loginTitulo}
      description={auth.loginDescripcion}
      footer={
        <>
          {auth.sinCuenta}{' '}
          <Link
            to="/registro"
            state={context.state}
            className="inline-flex min-h-11 items-center font-semibold text-bronce-700 underline-offset-2 hover:underline"
          >
            {auth.registrarse}
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {notice && <Alert tone="warning"><>{noticeReason ? p(noticeReason === 'expired' ? 'authExpired' : noticeReason === 'inactive' ? 'authInactive' : 'unknownRole') : <span lang="es">{notice}</span>}</></Alert>}
        <LoginForm />
      </div>
    </AuthPageLayout>
  );
};
