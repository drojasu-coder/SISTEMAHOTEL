# Facturación

## Implementación observada

- `createFactura` valida usuario, lee IVA del módulo configuraciones y crea factura `pendiente`.
- El subtotal llega como dato del request; IVA y total se calculan en backend.
- `createFacturaItem` valida factura, calcula subtotal, crea item y recalcula factura.
- Actualizar/mover item recalcula factura anterior y nueva por separado.
- Eliminar item destruye y recalcula.
- Factura no tiene asociación con Pago, Carrito ni Stripe.
- No se observó número fiscal generado ni constraint de duplicidad de factura.
- No se observó ownership en el service; debe revisarse el middleware de rutas.

No puede afirmarse que una factura sólo se genere después de pago: el código permite crearla independientemente. Tampoco hay evidencia de facturación automática o de una política de múltiples facturas por operación.

Riesgos: factura + item no es atómico, subtotal negativo o incoherente debe validarse contra validator, y actualizar item de una factura a otra puede dejar una factura recalculada antes de que falle la segunda.
