import { Countdown } from '@/components/ui/Countdown';
import { usePublicInterface } from '@/i18n/public';
/** Tiempo restante del carrito en una sola línea discreta (con aviso cuando queda poco o venció). */
export function CartExpiry({ expiresAt, onCheck }: { expiresAt: string | null | undefined; onCheck: () => void }) {
  const { p } = usePublicInterface();
  if (!expiresAt || !Number.isFinite(new Date(expiresAt).getTime())) return null;
  return <aside className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-bronce-200 bg-bronce-50 px-4 py-2 text-sm">
    <Countdown expiresAt={expiresAt} onExpire={onCheck} onResume={onCheck} label={p('purchaseExpiry')} warningText={p('purchaseSoon')} expiredText={p('purchaseExpired')} />
  </aside>;
}
