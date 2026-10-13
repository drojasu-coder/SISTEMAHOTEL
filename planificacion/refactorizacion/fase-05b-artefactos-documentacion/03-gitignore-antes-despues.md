# `.gitignore` antes y después

## Antes

```text
node_modules/
.env
dist/
build/
*.log
```

`backend/coverage/` aparecía como untracked porque no existía una regla para
coverage.

## Después

Se añadió únicamente:

```text
coverage/
```

La regla cubre `backend/coverage/` y cualquier reporte de coverage ubicado
bajo el repositorio. `git check-ignore -v backend/coverage/index.html`
confirmó la coincidencia.

No se añadieron reglas generales para JSON, Markdown, PDF, ZIP, OpenAPI,
fuentes o documentación.
