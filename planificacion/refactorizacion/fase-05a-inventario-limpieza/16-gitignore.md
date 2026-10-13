# Auditoría de `.gitignore`

Reglas actuales:

- `node_modules/`;
- `.env`;
- `dist/`;
- `build/`;
- `*.log`.

## Propuesta para 5B, no aplicada

Evaluar reglas explícitas para:

- `backend/coverage/`;
- otros reportes de cobertura;
- `.DS_Store` y archivos de IDE;
- caches de herramientas;
- exports generados de OpenAPI, sólo si se confirma que no es fuente;
- archivos temporales y logs adicionales;
- variantes `.env.*` sin incluir `.env.example`.

No se modificó `.gitignore` porque la decisión depende de distinguir fuente,
snapshot y entrega académica.
