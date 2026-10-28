import React from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { formatDisplayMoney, type DisplayCurrency } from '@/lib/money';
type TaxEvidence = { included: true; source: 'contract' | 'validated-configuration' };
export const MoneyReference: React.FC<{ amount: unknown; taxes?: TaxEvidence; currency?: DisplayCurrency }> = ({ amount, taxes, currency }) => {
  const { t, locale, currency: preferredCurrency } = useLocale();
  const display = formatDisplayMoney(amount, currency ?? preferredCurrency);
  return <span lang={locale}>{display ?? t('unavailableAmount')}{display && taxes?.included === true && <small className="ml-2">{t('taxesIncluded')}</small>}</span>;
};
