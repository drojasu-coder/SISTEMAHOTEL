import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/Button';
import { Alert, LoadingNotice } from '@/components/ui/Feedback';
import { PAGOS_ROUTES } from '../constants/routes';
import { getStripe } from '../utils/stripe';
import { formatearGTQ, textosCheckout } from '../textos';

interface FormularioTarjetaProps {
  monto: number;
  pagoId: number;
  onConfirmacionEnviada: () => void;
  onEstadoIncierto: () => void;
}

/**
 * Formulario interno de Stripe Elements.
 *
 * Confirmar el pago siempre requiere una acción explícita del usuario. Un
 * resultado del SDK sin error no se interpreta como pago aprobado: solo indica
 * que la confirmación fue enviada y que el backend debe verificarla.
 */
const FormularioTarjeta: React.FC<FormularioTarjetaProps> = ({
  monto,
  pagoId,
  onConfirmacionEnviada,
  onEstadoIncierto,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [confirmando, setConfirmando] = useState(false);
  const [errorTarjeta, setErrorTarjeta] = useState<string | null>(null);
  const confirmandoRef = useRef(false);

  const confirmar = async () => {
    if (!stripe || !elements || confirmandoRef.current) return;

    // El ref bloquea un segundo clic antes de que React vuelva a renderizar.
    confirmandoRef.current = true;
    setConfirmando(true);
    setErrorTarjeta(null);

    try {
      const resultado = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${PAGOS_ROUTES.RESULTADO(pagoId)}`,
        },
        redirect: 'if_required',
      });

      if (resultado.error) {
        if (
          resultado.error.type === 'card_error' ||
          resultado.error.type === 'validation_error'
        ) {
          setErrorTarjeta(textosCheckout.errores.tarjetaRechazada);
        } else {
          // Fallo de red, API o estado incierto: no afirmamos que el pago
          // fracasó ni permitimos repetirlo automáticamente.
          onEstadoIncierto();
        }
        return;
      }

      onConfirmacionEnviada();
    } catch {
      onEstadoIncierto();
    } finally {
      confirmandoRef.current = false;
      setConfirmando(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 rounded-lg border border-neutro-200 bg-neutro-50 p-3">
        <p className="eyebrow">{textosCheckout.pago.importe}</p>
        <p className="font-serif text-xl font-semibold text-neutro-900">
          {formatearGTQ(monto)}
        </p>
      </div>

      {errorTarjeta && (
        <Alert tone="error" title={textosCheckout.estados.rechazadoTitulo}>
          {errorTarjeta}
        </Alert>
      )}

      <PaymentElement />

      <Button
        type="button"
        size="lg"
        className="w-full"
        isLoading={confirmando}
        disabled={!stripe || !elements || confirmando}
        onClick={() => {
          void confirmar();
        }}
      >
        {confirmando
          ? textosCheckout.pago.confirmando
          : textosCheckout.pago.confirmar}
      </Button>

      <p className="text-xs text-neutro-600">
        {textosCheckout.pago.formularioDescripcion}
      </p>
    </div>
  );
};

interface StripePaymentFormProps {
  clientSecret: string;
  monto: number;
  pagoId: number;
  onConfirmacionEnviada: () => void;
  onEstadoIncierto: () => void;
}

/**
 * Carga el SDK de Stripe solo cuando existe un intento que el usuario puede
 * confirmar. Si la clave pública no está configurada, no se muestra el
 * formulario ni se envía ningún cobro.
 */
export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  clientSecret,
  monto,
  pagoId,
  onConfirmacionEnviada,
  onEstadoIncierto,
}) => {
  const stripePromise = useMemo(() => getStripe(), []);
  const [disponible, setDisponible] = useState<
    'cargando' | 'disponible' | 'no-disponible'
  >('cargando');

  useEffect(() => {
    let activo = true;

    stripePromise
      .then((stripe) => {
        if (activo) {
          setDisponible(stripe ? 'disponible' : 'no-disponible');
        }
      })
      .catch(() => {
        if (activo) setDisponible('no-disponible');
      });

    return () => {
      activo = false;
    };
  }, [stripePromise]);

  if (disponible === 'cargando') {
    return <LoadingNotice label={textosCheckout.pago.preparando} />;
  }

  if (disponible === 'no-disponible') {
    return (
      <Alert tone="error" title={textosCheckout.pago.titulo}>
        {textosCheckout.pago.tarjetaNoDisponible}
      </Alert>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, locale: 'es' }}
    >
      <FormularioTarjeta
        monto={monto}
        pagoId={pagoId}
        onConfirmacionEnviada={onConfirmacionEnviada}
        onEstadoIncierto={onEstadoIncierto}
      />
    </Elements>
  );
};
