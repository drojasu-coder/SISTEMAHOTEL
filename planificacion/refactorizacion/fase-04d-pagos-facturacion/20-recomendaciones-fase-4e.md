# Fase 4E — Regresión global, consolidación y cierre técnico

La Fase 4E será la etapa de regresión global, consolidación y cierre
técnico previo a la limpieza profunda. No debe iniciar todavía la limpieza,
el frontend ni la reactivación de José.

## Alcance obligatorio

Fase 4E deberá:

1. ejecutar una regresión completa del backend;
2. consolidar los hallazgos de las Fases 4A, 4B, 4C y 4D;
3. verificar los contratos HTTP y OpenAPI;
4. verificar la seguridad transversal;
5. verificar PostgreSQL y las transacciones ya protegidas;
6. verificar la arquitectura;
7. verificar pagos y reservas mediante las pruebas existentes;
8. elaborar una matriz única de riesgos pendientes;
9. separar defectos confirmados de riesgos identificados por inspección;
10. identificar los problemas técnicos que deben resolverse antes de la Fase 5;
11. identificar las reglas funcionales que deben quedar para José;
12. identificar las decisiones que requieren confirmación de negocio;
13. establecer una baseline técnica estable para iniciar posteriormente la
    limpieza profunda.

## Consolidación de hallazgos económicos de Fase 4D

Los siguientes puntos deben consolidarse como riesgos o decisiones
pendientes, no como implementaciones automáticas:

- ausencia de deduplicación explícita por `Stripe event.id`;
- relación no definida entre `Factura`, `Pago` y `Carrito`;
- operación externa de Stripe frente al commit de PostgreSQL;
- atomicidad de `factura-items`;
- ownership de facturación;
- estados e idempotencia;
- reglas de reembolso ambiguas.

Fase 4E debe conservar la evidencia disponible, distinguir lo reproducible
de lo inferido por inspección y evitar inventar reglas de negocio para cerrar
una brecha.

## Límites de la fase

Fase 4E no deberá:

- iniciar la limpieza profunda;
- iniciar el frontend;
- reactivar todavía a José;
- implementar silenciosamente correcciones funcionales;
- fijar un SHA definitivo para la futura rama de José.

José continúa pausado y aún no tiene SHA definitivo. La base futura se
determinará después de completar la consolidación técnica y las decisiones
correspondientes.

Si la regresión encuentra un defecto crítico reproducible, Fase 4E puede
recomendar bloquear el inicio de la Fase 5. Ese bloqueo debe sustentarse en
evidencia; no debe resolverse inventando reglas de negocio ni aplicando
correcciones funcionales sin autorización.
