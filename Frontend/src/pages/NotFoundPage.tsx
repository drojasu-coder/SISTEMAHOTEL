import React from 'react';
import { Link } from 'react-router-dom';
import { buttonStyles } from '@/components/ui/Button';
import { useLocale } from '@/i18n/LocaleContext';

export const NotFoundPage: React.FC = () => { const { t, locale } = useLocale(); return (
  <div lang={locale} className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-14 text-center">
    <div className="flex flex-col gap-2">
      <p className="eyebrow">404</p>
      <h1 className="text-[2rem] leading-[2.375rem]">{t('notFoundTitle')}</h1>
      <p className="text-sm text-neutro-600">{t('notFoundDescription')}</p>
    </div>
    <Link to="/" className={buttonStyles()}>
      {t('home')}
    </Link>
  </div>
); };
