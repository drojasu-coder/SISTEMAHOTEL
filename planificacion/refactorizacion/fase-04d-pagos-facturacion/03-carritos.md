# Carritos y carrito-items

## Reglas observadas

- Estados: `activo`, `expirado`; expiración se ejecuta de forma oportunista al consultar o modificar.
- El carrito pertenece a `usuario_id`; clientes sólo acceden al propio y ADMIN puede consultar cualquiera.
- Crear carrito bloquea la fila del usuario y rechaza un segundo carrito activo.
- Agregar/eliminar item usa transacción y lock del carrito; modificar requiere propietario, aunque el router también limita roles.
- El item resuelve descripción y precio desde la referencia backend. El cliente no envía precio ni cantidad al crear; cantidad inicia en `1`.
- Se rechaza la misma referencia dos veces.
- Habitaciones, eventos, bienestar, boletos y transporte tienen resolutores; mesa, actividad y amenidad devuelven `ITEM_PRICE_NOT_AVAILABLE`.
- Estados terminales como cancelado, expirado, pagado, usado y completado impiden comprar la referencia.

## Riesgos

La expiración ocurre antes de la transacción de item; si luego falla por carrito inactivo, el cambio a `expirado` permanece correctamente como operación separada, pero no es una unidad atómica con la operación solicitada. No se observó constraint único equivalente para items; la serialización depende del lock y consulta previa.
