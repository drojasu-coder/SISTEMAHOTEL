# Archivos modificados y creados

## Modificados

- `backend/.env.example`: variables de ambiente y placeholders seguros.
- `backend/.sequelizerc`: apunta al adaptador JavaScript.
- `backend/package.json`: scripts de migracion/seed.
- `backend/src/config/config.json`: elimina credenciales incrustadas.
- `backend/src/config/env.ts`: validacion centralizada.
- `backend/src/models/index.js`: usa la configuracion Sequelize compartida.
- `backend/src/services/stripe.service.ts`: consume configuracion validada.
- Servicios de reservas: consumen `APP_TIMEZONE` validado.

## Creados

- `backend/src/config/sequelize.config.js`
- `backend/tests/unit/env.test.ts`
- Los documentos de esta carpeta.
