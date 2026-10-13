# 4. Mapa de dependencias

## Cadena comprobada

Ejemplo de pagos:

`app.ts` monta `pago.routes` → la ruta importa `authMiddleware`, `roleMiddleware`, validadores y `pago.controller` → el controlador importa `pago.service` y `stripe.service` → el servicio importa modelos Sequelize, `db.sequelize`, configuración, Stripe y `paymentOwnership`.

Ejemplo transversal:

`auth.middleware.ts` depende de JWT, `AppError`, roles y el modelo `Usuario`. La autenticación no está aislada de infraestructura porque consulta directamente el modelo para comprobar usuario activo.

## Dependencias permitidas observadas

Controladores hacia servicios, rutas hacia middleware/validadores y servicios hacia modelos/configuración. `app.ts` hacia todas las rutas es composición explícita.

## Dependencias a limitar en el diseño

Un dominio no debería importar la implementación interna de otro dominio para ejecutar su caso de uso. Pagos debe coordinar reservas/carritos mediante contratos explícitos, no conocer detalles de sus consultas. La infraestructura Stripe/JWT debería quedar detrás de una interfaz sólo cuando una prueba o cambio real lo justifique.

## Ciclos

Se revisaron imports relativos TypeScript/JavaScript y no se confirmó ningún ciclo. Esto no prueba ausencia de ciclos dinámicos en runtime; una herramienta de grafo deberá ejecutarse antes de cualquier extracción.

