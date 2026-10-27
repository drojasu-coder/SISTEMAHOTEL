import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { buttonStyles } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/AuthContext';
import { getHomeRouteForUser } from '@/features/auth/routing';
import { useLocale } from '@/i18n/LocaleContext';

export const ForbiddenPage: React.FC = () => {
  const { t, locale } = useLocale();
  const { status, user } = useAuth();
  const signedIn = status === 'authenticated' && user !== null;

  return (
    <div lang={locale} className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-14 text-center">
      <span className="rounded-full bg-error-50 p-4 text-error-600">
        <ShieldAlert className="size-8" aria-hidden="true" />
      </span>

      <div className="flex flex-col gap-2">
        <p className="eyebrow text-error-600">{'403'}</p>
        <h1 className="text-[2rem] leading-[2.375rem]">{t('forbiddenTitle')}</h1>
        <p className="text-sm text-neutro-600">{t('forbiddenDescription')}</p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/" className={buttonStyles({ variant: 'ghost', className: 'w-full sm:w-auto' })}>
          {t('home')}
        </Link>
        {signedIn ? (
          <Link to={getHomeRouteForUser(user)} className={buttonStyles({ className: 'w-full sm:w-auto' })}>
            {t('mySpace')}
          </Link>
        ) : (
          <Link to="/login" className={buttonStyles({ className: 'w-full sm:w-auto' })}>
            {t('signInAction')}
          </Link>
        )}
      </div>
    </div>
  );
};
