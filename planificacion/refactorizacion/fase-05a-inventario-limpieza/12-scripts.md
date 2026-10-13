# Scripts

## Scripts npm

`dev`, `test`, `test:unit`, `test:integration`, `test:coverage`,
`typecheck`, `db:migrate`, `db:migrate:undo` y `db:seed` están declarados en
`backend/package.json`. Son consumidos por desarrolladores/CI/manual y no se
ejecutaron scripts destructivos.

## Scripts locales

`backend/scripts/export-openapi.ts` existe como untracked y aparentemente
exporta la especificación OpenAPI. Debe compararse con
`src/docs/swagger.ts` y `backend/openapi.json` en 5B; acción
`REQUIERE_CONFIRMACION`.

`script.sql` es un archivo SQL manual fuera de `backend/scripts`; no se
ejecutó porque el propósito y ambiente no están confirmados.
