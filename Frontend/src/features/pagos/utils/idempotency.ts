/**
 * Gestión de claves de idempotencia e identificación de intentos para Checkout.
 *
 * Principios y Políticas de Resiliencia:
 * 1. Cada clave representa una operación lógica de pago para un carrito y usuario determinados.
 * 2. Si el usuario recarga la pestaña o hay un fallo de red, se conserva la misma clave y el identificador
 *    del intento para permitir el replay idempotente en el backend (HTTP 201 replay) y la recuperación de estado.
 * 3. stripe.confirmPayment terminado sin error NO borra la clave ni el intento: la aprobación local la realiza
 *    el webhook del backend de forma asíncrona. La clave solo se limpia tras la confirmación terminal (estado 'aprobado').
 * 4. Si el importe del carrito cambia mientras existe un intento pendiente o creado:
 *    - NO se descarta ciegamente la clave previa ni se crea un nuevo intento de forma silenciosa.
 *    - Se detecta la discrepancia para que la interfaz impida confirmar un importe obsoleto o generar cobros
 *      incompatibles mientras el intento previo pueda ser procesado.
 * 5. NUNCA se persiste el client_secret de Stripe ni datos de tarjetas en almacenamiento local o sesión.
 */

const STORAGE_PREFIX = 'hunapu_checkout_attempt';

export interface StoredCheckoutAttempt {
  key: string;
  monto: number;
  pagoId?: number;
  timestamp: number;
}

export interface CheckoutKeyResult {
  key: string;
  esReutilizada: boolean;
  montoDifiere: boolean;
  montoPrevio?: number;
  pagoId?: number;
}

const buildStorageKey = (userId: number, carritoId: number): string =>
  `${STORAGE_PREFIX}_u${userId}_c${carritoId}`;

/**
 * Genera un identificador criptográficamente seguro sin depender de Date.now() como única fuente.
 */
export const generateSecureIdempotencyKey = (
  userId: number,
  carritoId: number
): string => {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
  return `chk-u${userId}-c${carritoId}-${uuid}`;
};

/**
 * Obtiene el intento almacenado en sessionStorage para la sesión del checkout, si existe.
 */
export const getStoredCheckoutAttempt = (
  userId: number,
  carritoId: number
): StoredCheckoutAttempt | null => {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(buildStorageKey(userId, carritoId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredCheckoutAttempt;
  } catch {
    return null;
  }
};

/**
 * Obtiene o registra una clave de idempotencia estable para el checkout.
 * Si ya existe una clave para este carrito/usuario:
 * - Se conserva la clave previa para permitir la recuperación e idempotencia.
 * - Si el monto actual difiere del monto con el que se inició el intento, se informa en `montoDifiere: true`
 *   sin borrar la clave, para que la pantalla de checkout aplique la política de protección.
 */
export const getOrCreateCheckoutIdempotencyKey = (
  userId: number,
  carritoId: number,
  monto: number
): CheckoutKeyResult => {
  const stored = getStoredCheckoutAttempt(userId, carritoId);

  if (stored && typeof stored.key === 'string') {
    const montoCoincide = Math.abs(Number(stored.monto) - Number(monto)) < 0.001;
    return {
      key: stored.key,
      esReutilizada: true,
      montoDifiere: !montoCoincide,
      montoPrevio: stored.monto,
      pagoId: stored.pagoId,
    };
  }

  const newKey = generateSecureIdempotencyKey(userId, carritoId);
  const data: StoredCheckoutAttempt = {
    key: newKey,
    monto: Number(monto),
    timestamp: Date.now(),
  };

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(buildStorageKey(userId, carritoId), JSON.stringify(data));
    } catch {
      // Ignorar fallos de cuota
    }
  }

  return {
    key: newKey,
    esReutilizada: false,
    montoDifiere: false,
    montoPrevio: Number(monto),
  };
};

/**
 * Asocia el ID del pago local devuelto por el backend al intento almacenado.
 */
export const recordCheckoutPagoId = (
  userId: number,
  carritoId: number,
  pagoId: number
): void => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    const stored = getStoredCheckoutAttempt(userId, carritoId);
    if (stored) {
      stored.pagoId = pagoId;
      window.sessionStorage.setItem(buildStorageKey(userId, carritoId), JSON.stringify(stored));
    }
  } catch {
    // Ignorar fallos de acceso a storage
  }
};

/**
 * Limpia la clave del intento almacenado.
 * IMPORTANTE: Solo debe invocarse cuando el pago haya alcanzado un estado terminal definitivo
 * verificado en el backend ('aprobado' o 'cancelado'). NO debe llamarse cuando confirmPayment
 * termine en el navegador, ya que el resultado persistido sigue siendo asíncrono e incierto.
 */
export const clearCheckoutIdempotencyKey = (
  userId: number,
  carritoId: number
): void => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(buildStorageKey(userId, carritoId));
  } catch {
    // Ignorar fallos de acceso a storage
  }
};
