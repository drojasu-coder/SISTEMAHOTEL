# Cambios aplicados

- Se añadió el módulo `backend/src/modules/configuraciones/`.
- Se movió la implementación de controller y service al módulo.
- Se mantuvieron fachadas legacy y el router documental.
- `app.ts` monta el entrypoint modular.
- Se añadió regresión OpenAPI y cobertura HTTP de autenticación.

No se actualizaron dependencias, modelos Sequelize, migraciones, asociaciones, reglas de negocio ni archivos protegidos.
