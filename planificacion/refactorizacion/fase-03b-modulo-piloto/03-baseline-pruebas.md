# 3. Baseline de pruebas

Antes de editar:

- `npm test`: 55 pruebas exitosas.
- `npm run typecheck`: exitoso.
- Se revisaron los tres catálogos candidatos y sus rutas, controladores, servicios y validadores.
- No existían pruebas específicas de HTTP/servicio para sucursales.

Por ello se añadió una prueba PostgreSQL aislada para capturar CRUD, ordenamiento, inexistencia y conflicto por habitaciones. No se cambiaron expectativas existentes para ocultar regresiones.

