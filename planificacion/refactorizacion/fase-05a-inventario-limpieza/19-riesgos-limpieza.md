# Riesgos de limpieza

| Riesgo | Severidad | Mitigación |
|---|---|---|
| borrar SQL o documentación académica | alta | `REQUIERE_CONFIRMACION` |
| eliminar fachada necesaria para Swagger | alta | probar consumidores y rutas |
| borrar test histórico de regresión | alta | mapear comportamiento protegido |
| tratar OpenAPI exportado como basura | alta | comparar generador y consumidores |
| mover historial y romper enlaces | media | inventario de referencias |
| incluir coverage/node_modules | media | reglas ignore y agrupación |
| convertir IVA/estados en env sin decisión | alta | separar regla de configuración |
| retirar dependencia usada dinámicamente | alta | revisar entrypoints/discovery |
| confundir frontend de diseño con app | media | confirmar alcance Fase 6 |

No hay candidatos aprobados para `PROBABLE_ELIMINAR` en 5A.
