import React from 'react';
import { useLocale } from '@/i18n/LocaleContext';
import { formatReferenceMoney } from '@/lib/money';
type TaxEvidence = { included: true; source: 'contract' | 'validated-configuration' };
export const MoneyReference: React.FC<{ amount: unknown; taxes?: TaxEvidence }> = ({ amount, taxes }) => {
  const { t, locale } = useLocale();
  const display = formatReferenceMoney(amount, locale);
  return <span lang={locale}>{display ?? t('unavailableAmount')}{display && taxes?.included === true && <small className="ml-2">{t('taxesIncluded')}</small>}</span>;
};
