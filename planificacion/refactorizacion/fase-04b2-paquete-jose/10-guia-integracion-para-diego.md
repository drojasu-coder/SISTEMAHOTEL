# Guía de integración para Diego

1. Solicitar SHA publicado y matriz endpoint/regla/prueba.
2. Comparar `git diff <base>..<sha>` y `git diff --name-status`.
3. Revisar commits individualmente con `git show --stat` y `git show`.
4. Clasificar archivos compartidos y detectar migraciones/modelos/transversales.
5. Ejecutar baseline antes de integrar.
6. Revisar URLs, status, JSON, errores, roles, validadores y OpenAPI.
7. Ejecutar pruebas específicas del lote, PostgreSQL, concurrencia y suite completa.
8. Rechazar temporalmente si faltan pruebas, hay cambios no declarados, secretos, relajación de seguridad, alteración de migraciones o regresión funcional.
9. Documentar cualquier regresión con SHA, test, logs y comportamiento esperado/actual.
10. Sólo con autorización decidir integración manual, merge o cherry-pick; nunca usar force push. Esta fase no ejecuta ninguna integración.
