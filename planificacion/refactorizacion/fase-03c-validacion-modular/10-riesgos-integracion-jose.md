# Riesgos de integración con José

La referencia local de José es `83d0827`; no se actualizó mediante fetch. El riesgo principal es que la rama remota haya cambiado después de esa referencia y toque rutas o configuración.

El cambio se limita a configuración, sus fachadas, el composition root y pruebas. No toca pagos, reservas, Stripe, modelos, migraciones ni dependencias. Antes de integrar se debe comparar nuevamente contra la referencia remota actual y resolver cualquier edición concurrente en `app.ts` o las rutas legacy.
