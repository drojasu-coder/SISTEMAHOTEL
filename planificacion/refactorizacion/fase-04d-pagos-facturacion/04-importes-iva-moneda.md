# Importes, IVA y moneda

| Área | Implementación |
|---|---|
| Pago | `DECIMAL(10,2)` en PostgreSQL; valida monto positivo con hasta dos decimales |
| Carrito item | normaliza precio con `Math.round(...*100)/100`; precio se resuelve del backend |
| Factura | calcula IVA y total redondeando a dos decimales |
| Reembolso | `DECIMAL(10,2)`; Stripe amount se convierte desde minor units |
| Stripe | sólo GTQ está declarado en `minorUnits`; se multiplica por 100 |
| Configuración | IVA actual se obtiene de `Configuracion`; fallback inicial `12` |

No se observó soporte real para USD aunque la API de Stripe recibe una moneda. El servicio de pago fuerza `GTQ`. Factura almacena `porcentaje_iva` por documento, preservando el valor usado al crearla.

Riesgos: suma de `number` sobre DECIMAL, límites de `DECIMAL(10,2)`, entradas `NaN/Infinity`, diferencia entre monto enviado y total de origen, y ausencia de una validación transversal de subtotal negativo en factura. No se cambió la política.
