# Fase 1C — Autenticación y permisos

Se ampliaron las pruebas PostgreSQL/HTTP para cubrir:

- token válido;
- rol insuficiente;
- usuario deshabilitado;
- token malformado;
- token expirado;
- credenciales inválidas.

La limpieza del usuario generado se ejecuta al finalizar. La autorización de todos los
roles administrativos y ownership de cada módulo aún requiere cobertura adicional.
