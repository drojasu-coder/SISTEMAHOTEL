# Mejoras implementadas

Se añadió `backend/tests/unit/architecture.test.ts` con tres protecciones:

1. identidad entre fachadas legacy e implementaciones modulares;
2. identidad entre route adapters y routers documentados;
3. detección reproducible de ciclos relativos en el árbol TypeScript.

No se aplicaron cambios productivos porque las alternativas consideradas —eliminar fachadas, mover comentarios OpenAPI o cambiar imports de modelos— tenían riesgo de compatibilidad no justificado.
