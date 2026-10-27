import { useNavigate } from 'react-router-dom';
import { Stepper } from '@/components/ui/Stepper';
import { usePublicInterface } from '@/i18n/public';

/** Solo los pasos disponibles: no inserta un formulario de datos sin contrato. */
export function PurchaseSteps({ current, allowCartReturn = false }: { current: number; allowCartReturn?: boolean }) {
  const { p } = usePublicInterface(); const navigate = useNavigate();
  return <Stepper ariaLabel={p('purchaseFlow')} steps={[p('purchaseCart'), p('purchasePay'), p('purchaseResult')]} current={current} onChange={allowCartReturn ? (step) => { if (step === 0) navigate('/carrito'); } : undefined} />;
}
