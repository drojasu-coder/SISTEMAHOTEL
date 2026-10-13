# Localhost, puertos y URLs

- `localhost` y `127.0.0.1` en validación de base de datos de test son
  restricciones de aislamiento, no URLs productivas.
- Los orígenes localhost de CORS son defaults de desarrollo existentes.
- El puerto HTTP ya usa `PORT`.
- La URL de Swagger es documentación y no se modificó.
- Las rutas `/api/...` son contrato HTTP y permanecen literales.

No se detectó una URL productiva fija que requiriera externalización.
