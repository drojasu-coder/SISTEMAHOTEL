import { Card } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/AuthContext';
import { usePublicInterface } from '@/i18n/public';
export function AccountContact() {
  const { user, status } = useAuth(); const { p } = usePublicInterface();
  if (status !== 'authenticated' || user?.rol !== 'cliente') return null;
  return <Card className="flex flex-col gap-3"><h2 className="font-serif text-lg">{p('purchaseAccount')}</h2><dl className="grid min-w-0 gap-3 text-sm sm:grid-cols-2">
    <div><dt className="text-xs text-neutro-600">{p('purchaseName')}</dt><dd className="break-words">{user.nombre}</dd></div>
    <div><dt className="text-xs text-neutro-600">{p('purchaseEmail')}</dt><dd className="break-all">{user.email}</dd></div>
    {user.telefono && <div><dt className="text-xs text-neutro-600">{p('purchasePhone')}</dt><dd>{user.telefono}</dd></div>}
  </dl><p className="text-xs text-neutro-600">{p('purchaseAccountNote')}</p></Card>;
}
