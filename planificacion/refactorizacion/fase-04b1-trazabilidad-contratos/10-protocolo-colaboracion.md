# Protocolo de colaboración

1. Diego publica la base validada identificando HEAD y resultados.
2. José sincroniza su nueva rama con esa base sólo después de acordar el procedimiento.
3. Se asignan dominios y archivos; no se comparten simultáneamente `app.ts`, Sequelize, modelos/migraciones o middlewares críticos.
4. Cada cambio funcional se publica en commits pequeños con regla, endpoint y prueba.
5. Diego compara commits, contratos y archivos modificados.
6. Ambos ejecutan pruebas antes de integrar.
7. La integración se realiza sólo con autorización explícita.
8. Se ejecuta regresión completa después de integrar.

La fase no ejecuta este procedimiento ni modifica ramas.
