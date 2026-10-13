# 5. Migración paso a paso

1. Verificación de rama, commit `669113e`, baseline y documentación 3A.
2. Comparación de `sucursales`, `salones` y `configuraciones`.
3. Autorización explícita para usar `sucursales`.
4. Creación del servicio y controlador modulares trasladando la lógica existente sin cambiar reglas.
5. Reexportación de las fachadas antiguas para compatibilidad.
6. Reexportación del validador Zod, evitando duplicación.
7. Cambio del composition root para montar el entrypoint modular.
8. Ajuste del router documentado para consumir componentes modulares.
9. Prueba PostgreSQL específica: CRUD, orden, 404 y conflicto 409.
10. Ejecución de suite completa, unitarias, integración, cobertura y typecheck.

La estrategia de reversión consiste en revertir únicamente el cambio del piloto cuando se autorice un commit; no requiere reset, limpieza ni afectar archivos locales ajenos.

