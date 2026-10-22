/**
 * Gestión de claves de idempotencia para el flujo de Checkout.
 *
 * Principios:
 * 1. Cada clave representa una operación lógica de pago para un carrito y usuario determinados.
 * 2. Si el usuario recarga la página o hay un fallo de red transitorio, se conserva la misma clave
 *    para permitir la recuperación mediante replay idempotente en el backend (HTTP 201 replay).
 * 3. Si el importe a pagar cambia (p. ej. cambio de reserva o tarifa), la clave previa se invalida
 *    y se genera una nueva para evitar colisiones 409 IDEMPOTENCY_CONFLICT.
 * 4. NUNCA se persiste el client_secret de Stripe ni datos de tarjetas en el navegador.
 */

const STORAGE_PREFIX = 'hunapu_checkout_idemp';

interface StoredIdempotencyData {
  key: string;
  monto: number;
  timestamp: number;
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
 * Obtiene o crea una clave de idempotencia estable para la sesión actual del checkout.
 * Si el monto coincide con una operación previa en curso para el mismo carrito, la reutiliza.
 * Si no existe o el monto difiere, genera una nueva y actualiza sessionStorage.
 */
export const getOrCreateCheckoutIdempotencyKey = (
  userId: number,
  carritoId: number,
  monto: number
): string => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return generateSecureIdempotencyKey(userId, carritoId);
  }

  const storageKey = buildStorageKey(userId, carritoId);

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredIdempotencyData;
      // Si el monto no ha cambiado, mantenemos la clave de la operación lógica en curso
      if (
        typeof parsed.key === 'string' &&
        Math.abs(Number(parsed.monto) - Number(monto)) < 0.001
      ) {
        return parsed.key;
      }
    }

    // Si no existía o el monto cambió, generamos una nueva
    const newKey = generateSecureIdempotencyKey(userId, carritoId);
    const data: StoredIdempotencyData = {
      key: newKey,
      monto: Number(monto),
      timestamp: Date.now(),
    };
    window.sessionStorage.setItem(storageKey, JSON.stringify(data));
    return newKey;
  } catch {
    // Respaldo seguro en caso de cuotas de storage o políticas estrictas
    return generateSecureIdempotencyKey(userId, carritoId);
  }
};

/**
 * Limpia la clave de idempotencia almacenada cuando el pago fue completado o cancelado definitivamente.
 */
export const clearCheckoutIdempotencyKey = (
  userId: number,
  carritoId: number
): void => {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(buildStorageKey(userId, carritoId));
  } catch {
    // Ignorar errores de acceso a storage
  }
};
