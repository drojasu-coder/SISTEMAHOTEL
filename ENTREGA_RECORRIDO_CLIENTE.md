# Entrega: flujo de reserva del cliente hasta el pago

Objetivo final entregado:
Un cliente puede reservar una habitación y llegar al pago sin repetir la selección de habitaciones ni los criterios de búsqueda una vez confirmada la reserva.

---

## 1. Recorrido anterior y sus problemas

El recorrido más reciente que se estaba validando antes de esta entrega corría así:

- El cliente entra a la búsqueda pública de habitaciones con criterios de fecha, sedes y número de huéspedes.
- Después de buscar, se mostraba una lista de habitaciones disponibles desde la que podía seleccionar una.
- Al seleccionar, el cliente quedaba en una pantalla de confirmsión/resumen y luego pasaba al pago.
- Durante ese proceso, los criterios de búsqueda, la selección de habitación y el carrito se discretaamente en distintos momentos y distintas capas: prefs públicas, draft de estancia, carrito, reserva pendiente y checkout.

Problemas señalados en el recorrido:

- En varias etapas el cliente tenía que volver a tocar la selección de habitación o repetir búsqueda aunque ya tenía una habitación seleccionada.
- El flujo de búsqueda, reselección y checkout tenía más saltos de los necesarios porque los datos de la reserva no se mantenían de forma cohesiva entre búsqueda, carrito y checkout.
- Los botones y textos de acción estaban dispersos o no usaban las claves de texto centralizadas en algunas pantallas.
- El frontend estaba creciendo en número de features y páginas, con múltiples rutas relacionadas con reservas, pagos y mis reservas, lo que aumentaba la superficie de estado a coordinar.

En resumen: el recorrido anterior ya tenía la pieza central (búsqueda -> selección -> pago), pero el cliente podía repetir selección de habitación y el estado del draft/reserva/carrito no estaba unido de forma tan directa como la entrega pide.

---

## 2. Recorrido nuevo implementado

El recorrido nuevo que se valida en esta entrega es:

1. Entrada pública:
   - El cliente usa la búsqueda pública de habitaciones con sedes, fechas y número de huéspedes.
   - El formulario usa el texto `Buscar disponibilidad` y durante la carga muestra `Consultando disponibilidad...`.
   - El número de huéspedes se controla con los controles menos/más, mínimo 1 y sin spinner nativo.
   - Los criterios de búsqueda se pueden conservar como draft de estancia para no perderlos entre cambios.

2. Selección:
   - Tras la búsqueda, el cliente ve las habitaciones disponibles y selecciona una.
   - La habitación seleccionada se añade al carrito público.
   - El cliente puede ver un resumen de la reserva antes de pagar.

3. Pago:
   - El cliente va al checkout desde la reserva/carrito ya preparado.
   - El checkout orquesta resumen, preferencias de contacto, método de pago e intento de pago.
   - El intento de pago usa idempotencia y vuelve al backend para crear el pago y, en el caso de tarjeta, el PaymentIntent de Stripe.

4. Confirmación y continuidad:
   - Tras el pago, el cliente llega al resultado y puede ver sus reservas sin volver a la selección de habitaciones ni volver a ingresar los criterios de búsqueda.
   - El cliente puede consultar mis reservas y el estado de la reserva desde su zona.

El punto clave de esta entrega es que, una vez elegida la habitación y avanzado hacia el pago, el cliente no tiene que repetir la selección de habitaciones.

---

## 3. Pasos eliminados o simplificados

Pasos simplificados en esta entrega:

- Menos re-ingerencia de criterios de búsqueda: los criterios se conservan o se reutilizan entre búsqueda, selección y checkout en lugar de obligar al cliente a reescribirlos.
- Menos alternancia entre “buscar”, “seleccionar” y “pagar”: el flujo intenta mantenerse en una línea continua una vez que la habitación está elegida.
- Más texto centralizado: varias pantallas clave ahora usan textos explícitos del feature en lugar de strings dispersos.
- Control de huéspedes más restrictivo y usable: mínimo 1, botones menos/más, y deshabilitado cuando el count es <= 1.

Lo que no se eliminó, pero se coordina mejor:

- El carrito sigue existiendo como paso intermedio, pero ahora está más directamente conectado con la reserva seleccionada.
- El backend sigue siendo quien decide disponibilidad, estados y pago; el frontend no inventa precios ni estados.

---

## 4. Archivos modificados

Principales archivos front end involucrados en la entrega:

- Frontend/src/features/habitaciones/public/GuestCount.tsx
- Frontend/src/features/habitaciones/public/StayDateRange.tsx
- Frontend/src/features/habitaciones/public/stayDraft.ts
- Frontend/src/features/habitaciones/public/useRoomData.ts
- Frontend/src/features/habitaciones/types.ts
- Frontend/src/features/crear-reserva/textos.ts
- Frontend/src/features/crear-reserva/types.ts
- Frontend/src/features/crear-reserva/schemas/busquedaReservaSchema.ts
- Frontend/src/features/crear-reserva/hooks/useCrearReserva.ts
- Frontend/src/features/crear-reserva/index.ts
- Frontend/src/features/crear-reserva/components/CriteriosBusquedaForm.tsx
- Frontend/src/features/crear-reserva/components/HabitacionesDisponiblesList.tsx
- Frontend/src/features/crear-reserva/components/ResumenReservaModal.tsx
- Frontend/src/features/crear-reserva/components/ReservaConfirmadaCard.tsx
- Frontend/src/pages/CrearReservaPage.tsx

Otros archivos pertinentes que se revisaron/validaron como parte del ecossistema:

- Frontend/src/features/carrito/api/carritoApi.ts
- Frontend/src/features/carrito/hooks/useCarritoPantalla.ts
- Frontend/src/features/carrito/hooks/useAddReservaToCarrito.ts
- Frontend/src/features/carrito/types.ts
- Frontend/src/features/carrito/constants/routes.ts
- Frontend/src/features/carrito/components/ClienteCarritoGate.tsx
- Frontend/src/features/carrito/components/ResumenCarrito.tsx
- Frontend/src/features/carrito/textos.ts
- Frontend/src/features/reservas/api/reservasApi.ts
- Frontend/src/features/reservas/types.ts
- Frontend/src/features/reservas/constants/routes.ts
- Frontend/src/features/reservas/index.ts
- Frontend/src/features/pagos/api/pagosApi.ts
- Frontend/src/features/pagos/hooks/useCheckoutQueries.ts
- Frontend/src/features/pagos/hooks/useCrearIntentoPago.ts
- Frontend/src/features/pagos/utils/idempotency.ts
- Frontend/src/features/pagos/types.ts
- Frontend/src/features/pagos/constants/routes.ts
- Frontend/src/features/pagos/components/ClienteCheckoutGate.tsx
- Frontend/src/features/pagos/components/ResumenCheckout.tsx
- Frontend/src/features/pagos/components/StripePaymentForm.tsx
- Frontend/src/features/pagos/components/PagoResultadoCard.tsx
- Frontend/src/features/pagos/textos.ts
- Frontend/src/features/pagos/index.ts
- Frontend/src/features/auth/AuthContext.tsx
- Frontend/src/features/auth/reservationDraft.ts
- Frontend/src/features/auth/secureReturn.ts
- Frontend/src/features/preferencias/PublicPreferences.tsx
- Frontend/src/features/preferencias/storage.ts
- Frontend/src/api/client/http.ts
- Frontend/src/api/session.ts
- Frontend/src/components/shared/publicNavigation.ts
- Frontend/src/pages/CheckoutPage.tsx
- Frontend/src/pages/MisReservasPage.tsx
- Frontend/src/features/mis-reservas/hooks/useMisReservas.ts
- Frontend/src/features/mis-reservas/components/MisReservasLayout.tsx
- Frontend/src/features/mis-reservas/components/ReservaCard.tsx
- Frontend/src/features/mis-reservas/components/ReservaDetalle.tsx

Principales archivos backend involucrados o revisados:

- backend/src/services/habitaciones/reservaHabitacion.service.ts
- backend/src/services/pago.service.ts
- backend/src/controllers/pagos/pago.controller.ts
- backend/src/routes/pagos/pago.routes.ts
- backend/src/constants/payments.ts
- backend/src/constants/cart.ts
- backend/src/validators/habitaciones/reservaHabitacion.validator.ts
- backend/src/models/pago.js
- backend/src/models/carrito.js
- backend/src/models/carritoitem.js
- backend/src/models/reservaamenidad.js

---

## 5. Servicios y endpoints reutilizados

Frontend reutiliza principalmente:

- API pública de habitaciones/disponibilidad para la búsqueda inicial.
- Carrito del frontend para mantener la selección antes del pago.
- Reservas del frontend para consultar estado y confirmar/cancelar cuando aplica.
- Pagos del frontend para crear intento de pago, verificar resultado y comprobantes.
- Auth del frontend para mantener sesión, usuario y credenciales en las peticiones salientes.
- Preferencias públicas para capturar y reutilizar datos de contacto relevantes.

Backend reutiliza principalmente:

- Reserva de habitaciones como origen del registro de la reserva pendiente y de la confirmación una vez pagada.
- Pago como punto de entrada del intento de pago, la verificación y los comprobantes.
- Carrito como contenedor intermedio de ítems antes del pago.
- Stripe como pasarela para tarjeta, con webhook para completar/cancelar.

En toda esta entrega, los precios y totales provienen del backend; el frontend no decide ni almacena precios de confianza como si fueran verdad absoluta.

---

## 6. Cambios de backend necesarios

Los cambios del backend necesarios para esta entrega son principalmente de coordinación, no de invento de reglas nuevas:

- Disponibilidad y creación de reserva de habitación deben poder consultarse y registrarse con los datos que el frontend envía: habitación, fechas, huéspedes y usuario autenticado cuando aplica.
- El backend debe poder expresar si la reserva está pendiente/confirmada y si el pago está en proceso o aprobado.
- El backend debe mantener la relación entre carrito, ítem de carrito y reserva para que el pago pueda atribuirse correctamente.
- El backend debe validar que el cliente no pague algo que ya está pagado o que no está disponible, y debe rechazar con conflictos controlados cuando el origen ya no es válido.
- El backend debe poder procesar websocket/webhook de Stripe para actualizar el estado del intento de pago y, en su caso, confirmar la reserva cuando se completa.

En esta entrega no se adicionan reglas de negocio inventadas para hacer pasar el flujo; lo existente se usa para que el cliente pueda reservar y llegar al pago.

---

## 7. Cómo se gestionan carrito, pago y reservas pendientes

Carrito:

- Se usa como contenedor público de la selección antes del pago.
- La habitación seleccionada se añade al carrito y el resumen se puede mostrar antes de avanzar.
- El frontend no usa el carrito como verdad absoluta de precios, pero sí como vehículo de la selección que el backend valida.

Pago:

- El pago se crea desde el origen correcto: carrito o reserva de habitación, pero no ambos a la vez.
- Si es tarjeta, el backend crea un PaymentIntent en Stripe y el frontend completa el pago con el client secret.
- El estado final llega por webhook y el frontend lo refleja como resultado.
- Los comprobantes están disponibles para descargar cuando aplica.

Reservas pendientes:

- Una reserva de habitación puede quedar pendiente antes de pagar.
- El backend controla cuándo pasa a confirmada según el pago/estado aplicable.
- El cliente puede consultar su estado desde mis reservas sin volver a la selección de habitaciones.

---

## 8. Qué sucede al cambiar o cancelar

Si el cliente cambia algo antes del pago:

- Se puede ajustar la selección en la búsqueda o en el carrito según la pantalla correspondiente.
- Los criterios de búsqueda y la selección se coordinan para no perder el contexto inútilamente.
- El resumen puede actualizarse antes de enviar al pago.

Si el cliente cancela:

- Puede retirar la selección del carrito cuando aplica.
- Si aún no ha pagado, eso interrumpe el flujo sin crear reserva ni intento de pago innecesario.
- El cliente puede volver a buscar y seleccionar sin que el sistema lo bloquee por diseño; la validación real la hace el backend cuando es necesario.

La regla de oro en esta entrega:

- Si algo es cancelable o cambiable antes del pago, el sistema lo permite en el frontend de la forma más directa posible.
- Si el cambio afecta disponibilidad, estado o origenes del pago, el backend responde con errores controlados y no con 500.

---

## 9. Verificaciones reales

Verificaciones realizadas en esta entrega:

- TypeScript del frontend sin errores en noEmit.
- Build del frontend exitoso.
- Revisión de los archivos centrales del flujo: búsqueda, selección, resumen, carrito, checkout, pagos, auth, preferencias y mis reservas.
- Confirmación de que los textos del botón y de carga están alineados con el archivo de textos del feature.
- Confirmación de que el control de huéspedes usa mínimo 1 y deshabilita “menos” cuando count <= 1.
- Confirmación de que el backend maneja origen único, validación de disponibilidad y aspectos de pago, en lugar de que el frontend los decida.

No se ejecutaron pruebas backend automatizadas en esta entrega porque el foco era la entrega del flujo del cliente y la coordinación entre frontend/backend. Si se quiere validar comportamiento crítico, se debe hacer con las pruebas del backend y/o QA sobre hotel_test_db.

---

## 10. Qué queda pendiente por reglas de negocio

Pendiente por reglas de negocio, fuera del alcance de esta entrega:

- Confirmación final de reglas de disponibilidad por tipo de habitación/sede/política de cancelación.
- Confirmación de reglas de precios, promociones, impuestos e IVA según la política del hotel.
- Confirmación de reglas de cancelación, reembolso y penalizaciones según la política aplicable.
- Confirmación de reglas de pagos parciales, anticipos o saldos pendientes si aplica.
- Confirmación de reglas de duplicación de reservas, colisión de carrito y reutilización de referencias.
- Confirmación de reglas de facturación y emisión de comprobantes/documentos legales.
- Confirmación de reglas de autenticación, roles y accesos según el alcance del sistema.
- Validación final con datos reales y con el equipo de negocio/pólizas del hotel.

También queda parte de pulido que no se ha abordado aquí:

- Chunk size grande en producción del frontend.
- Posibles mejoras de code-splitting y carga diferida de features pesados.
- Posibles mejoras de UX en los estados de carga y error de pago.
- Posibles mejoras de i18n/textos en pantallas adicionales.

Lo que sí está entregado:

- El cliente puede reservar una habitación y llegar al pago sin repetir la selección de habitaciones ni los criterios de búsqueda una vez que ya tiene la reserva seleccionada.
