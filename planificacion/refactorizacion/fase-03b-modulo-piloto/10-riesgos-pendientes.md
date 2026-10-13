# 10. Riesgos pendientes

- El router documentado permanece en la carpeta antigua como adaptador; una fase posterior puede mover sus anotaciones al módulo, pero debe validar que Swagger siga encontrando todas las operaciones.
- El módulo sigue usando modelos Sequelize globales; no se introdujo repository porque habría añadido abstracción sin beneficio probado para este CRUD.
- La prueba específica usa PostgreSQL aislado, pero no añade todavía una matriz completa HTTP para cada endpoint administrativo.
- La rama de José tiene cambios divergentes en superficies transversales; aunque no cambió los paths específicos de sucursales en la referencia local, `app.ts` y middleware pueden generar conflictos futuros.
- No se tocaron las dos vulnerabilidades npm pendientes ni se actualizaron dependencias.

