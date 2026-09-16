# Auditoría del backend de pagos

## 1. Stripe SDK/config/source

### Hallazgos

- En el estado actual de la rama, `backend/package.json` no incluye `stripe` como dependencia y no existe un directorio `backend/src/services/pagos/`, `backend/src/controllers/pagos/` ni `backend/src/routes/pagos/`.
- El commit histórico `127cf0b` (“integración con Stripe”) sí añadió `stripe: "^22.6.2"` (además de `@aws-sdk/client-s3`, `multer` y `socket.io`) a `backend/package.json`, pero esos cambios no están presentes en el árbol actual.
- `backend/.env.example` contiene una clave secreta de Stripe de prueba hardcodeada. Esto es un secreto expuesto y debe revocarse; un ejemplo nunca debe contener una clave real.
- `backend/src/config/env.ts` valida `PORT`, `JWT_SECRET`, etc., pero no declara ni valida `STRIPE_SECRET_KEY`. Por tanto, la configuración de Stripe no falla al arrancar y queda consultada directamente mediante `process.env`.

El código de Stripe del commit histórico era:

```ts
import Stripe from "stripe";
import { AppError } from "../../utils/AppError";

export const createPaymentIntent = async (monto: number) => {
  // 1. Verificamos que la llave exista
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError(500, "STRIPE_ERROR", "Falta configurar la llave de Stripe en el .env");
  }

  //esto inicializa stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-08-26.dahlia", 
  });

  // 3. Convertimos a centavos (ej. $150.50 -> 15050)
  const montoEnCentavos = Math.round(monto * 100);

  // 4. Creamos la intención de pago
  const paymentIntent = await stripe.paymentIntents.create({
    amount: montoEnCentavos,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
  });

  return paymentIntent.client_secret;
};
```

Conclusión: no hay una integración Stripe operativa en la rama actual; el único intento histórico crea un PaymentIntent, pero no completa el flujo de negocio ni persiste el pago.

## 2. JSON response pattern

La aplicación usa respuestas JSON uniformes en `backend/src/app.ts`:

```ts
res.status(200).json({
  success: true,
  statusCode: 200,
  message: "API de Hotel está funcionando correctamente",
});
```

Los controllers normales siguen `{ success, statusCode, message, data }`; por ejemplo, `backend/src/controllers/auth.controller.ts`:

```ts
res.status(200).json({
  success: true,
  statusCode: 200,
  message: "Inicio de sesión exitoso",
  data: result,
});
```

El controller histórico de pagos rompe ese patrón:

```ts
res.status(200).json({ status: "success", data: { clientSecret } });
```

Conclusión: el endpoint de pagos debe devolver el mismo contrato (`success`, `statusCode`, `message`, `data`) y no mezclar `status` con el formato global.

## 3. AppError handling

`backend/src/utils/AppError.ts` define:

```ts
export class AppError extends Error {
    public statusCode: number;
    public code: string;
    public details?: unknown;
    public isOperational: boolean;

    constructor(
        statusCode: number,
        code: string,
        message: string,
        details?: unknown,
    ){
        super(message);

        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}
```

`backend/src/middlewares/error.middleware.ts` convierte `AppError`, JSON inválido, errores de Sequelize y errores de conexión en respuestas con `success: false`, `statusCode`, `code`, `message` y `details` opcionales. Los errores 500+ se registran con método, URL, mensaje y stack sin exponer el stack al cliente.

Conclusión: la infraestructura es adecuada y el servicio Stripe histórico usa `AppError`, pero reporta una configuración ausente como 500 (`STRIPE_ERROR`). Los errores de Stripe (`StripeCardError`, errores de API, timeouts o rate limits) no se traducen a códigos HTTP/errores de dominio y, al propagarse sin tratamiento específico, terminan como error interno genérico.

## 4. Authentication

`backend/src/routes/auth.routes.ts` protege `/api/auth/me` con `authMiddleware`; `backend/src/middlewares/auth.middleware.ts` valida esquema Bearer, firma, expiración, `sub`, tipo `access`, existencia/estado/rol actual del usuario y asigna `req.user`.

El router histórico de pagos aplicaba autenticación:

```ts
const router = Router();

router.use(authMiddleware); //solo usuarios logueados pueden pagar

router.post("/intent", validateBody(createPaymentIntentSchema), pagoController.createIntent);
```

Conclusión: el requisito de estar autenticado se cubría, pero no había `requireRole`, comprobación de propietario del carrito, ni asociación entre el usuario autenticado y el monto/recurso que se iba a pagar. Un usuario autenticado podía solicitar un intent con cualquier monto válido.

## 5. Cart relation/totals/payment status

`backend/src/models/carrito.js` relaciona el carrito con el usuario y sus ítems:

```js
static associate(models) {
  Carrito.belongsTo(models.Usuario, { foreignKey: "usuario_id" });
  Carrito.hasMany(models.CarritoItem, { foreignKey: "carrito_id" });
}
```

`backend/src/models/carritoitem.js` guarda `carrito_id`, `tipo_item`, `referencia_id`, `descripcion`, `precio`, `cantidad` y `promocion_id`. `backend/src/services/carrito/carritoItem.service.ts` resuelve la referencia en el backend, valida propiedad/estado y calcula el total:

```ts
const total =
  items.reduce(
    (
      sum: number,
      item: any
    ) =>
      sum +
      Number(
        item.precio
      ) *
        Number(
          item.cantidad
        ),
    0
  );
```

El total se redondea a dos decimales y el precio no se acepta desde el frontend al agregar el ítem. Sin embargo, `backend/src/models/pago.js` y `backend/src/migrations/20260912001000-create-pago.js` relacionan un pago únicamente con `reserva_habitacion_id`, no con `carrito_id` ni `factura_id`:

```js
Pago.belongsTo(models.ReservaHabitacion, { foreignKey: "reserva_habitacion_id" });
```

El modelo de pago solo tiene `monto`, `metodo`, `estado` (por defecto `"pendiente"`) e `id_transaccion_externo`; no existe servicio/controller/ruta actual que lo cree o actualice, ni webhook que cambie el estado. Además, el carrito admite `habitacion`, `evento`, `mesa`, `actividad`, `amenidad`, `bienestar`, `boleto_parque` y `transporte`, mientras que varios resolvers todavía lanzan `ITEM_PRICE_NOT_AVAILABLE`.

Conclusión: el cálculo del carrito es del lado servidor, pero el intent histórico no usa ese total. La relación de pagos no representa compras de carrito multiservicio y no hay transición confiable `pendiente` → `pagado`/`fallido` ni idempotencia.

## 6. Validators

El validator histórico era `backend/src/validators/pagos/pago.validator.ts`:

```ts
import { z } from "zod";

export const createPaymentIntentSchema = z
  .object({
    monto: z.number().positive("El monto debe ser mayor a 0"),
    descripcion: z.string().optional()
  })
  .strict();
```

`backend/src/middlewares/validate.middleware.ts` aplica `safeParse`, reemplaza `req.body` por los datos validados y devuelve `AppError(400, "VALIDATION_ERROR", ...)`.

Conclusión: el validator rechaza tipos incorrectos, montos no positivos y campos desconocidos, pero no limita decimales, moneda, máximo, carrito, ítems ni reserva. `descripcion` se valida pero nunca se usa. Validar `monto` enviado por el cliente no es suficiente: el backend debe obtener el importe desde el carrito/reserva y comparar en unidad mínima de moneda.

## 7. Concrete Stripe integration gaps

1. `stripe` no está en el `backend/package.json` actual y no existe endpoint de pagos registrado en `backend/src/app.ts`.
2. `backend/.env.example` expone una clave `sk_test_...`; debe eliminarse, revocarse y sustituirse por un placeholder. `STRIPE_SECRET_KEY` debe incorporarse a `backend/src/config/env.ts`.
3. No existe un cliente Stripe reutilizable/configurado una sola vez; el código histórico crea una instancia dentro de cada llamada.
4. El monto lo controla el cliente (`req.body.monto`); no se calcula desde `backend/src/services/carrito/carritoItem.service.ts`, no se bloquea el carrito y no se evita que el precio cambie entre intent y confirmación.
5. No se persiste `payment_intent.id`, `client_secret`, `carrito_id`, usuario, moneda, importe en centavos ni estado local.
6. No hay confirmación server-side ni webhook (`payment_intent.succeeded`, `payment_intent.payment_failed`), verificación de firma del webhook, ni actualización transaccional de `pagos`, carrito, reservas o factura.
7. No hay idempotency key ni manejo de reintentos; una repetición puede crear varios PaymentIntents.
8. No se valida que la moneda y el importe cumplan la configuración del sistema; el código fija `"usd"` sin documentar ni validar esa decisión.
9. No se traduce el error de tarjeta/rechazo de Stripe a una respuesta de negocio segura; puede terminar en 500 genérico.
10. No se implementa la interfaz propia exigida: Payment Intents + Stripe Elements/Stripe.js solo captura los datos de tarjeta; el backend debe entregar `clientSecret`, pero también debe cerrar el ciclo de orden/pago.
11. El esquema actual de `pagos` solo soporta `reserva_habitacion_id`, incompatible con el carrito de múltiples tipos y con el total agregado.
12. El controller histórico no usa el contrato JSON común y solo devuelve `clientSecret`; no devuelve un identificador local de pago/orden.

Conclusión general: el repositorio tiene modelos y lógica de carrito suficientes para ser la fuente de verdad del importe, y cuenta con autenticación, validación y manejo centralizado de errores. Stripe, sin embargo, está únicamente en un commit histórico incompleto; falta integrar dependencia/configuración, endpoint coherente, cálculo confiable, persistencia, webhooks, estados, seguridad de secretos e idempotencia. Esta auditoría es documental y no modifica el código fuente.
