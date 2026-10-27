import { Countdown } from '@/components/ui/Countdown';
import { usePublicInterface } from '@/i18n/public';
export function CartExpiry({ expiresAt, onCheck }: { expiresAt: string | null | undefined; onCheck: () => void }) {
  const { p } = usePublicInterface();
  if (!expiresAt || !Number.isFinite(new Date(expiresAt).getTime())) return null;
  return <aside className="rounded-xl border border-bronce-200 bg-bronce-50 p-4"><h2 className="font-semibold text-sm">{p('purchaseExpiry')}</h2>
    <Countdown expiresAt={expiresAt} onExpire={onCheck} onResume={onCheck} label={p('purchaseExpiry')} warningText={p('purchaseSoon')} expiredText={p('purchaseExpired')} />
    <p className="mt-2 text-xs text-neutro-600">{p('purchaseExpiryNote')}</p></aside>;
}
