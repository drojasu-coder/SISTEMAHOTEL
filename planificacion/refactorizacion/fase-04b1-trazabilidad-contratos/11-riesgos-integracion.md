# Riesgos de integración

- La referencia local de José puede quedar obsoleta si desarrolla cambios no publicados.
- Los dominios de reservas, pagos, carritos y facturación tienen riesgo alto aunque Git no muestre conflictos textuales.
- `app.ts`, routers legacy y OpenAPI pueden tener conflicto semántico aunque sus archivos no coincidan.
- Un conteo OpenAPI igual al conteo Express no prueba schemas, responses, roles ni status.
- El CSV contiene `UNKNOWN` o `requires trace` donde la extracción estática no fue concluyente.

Mitigación: actualizar referencias con autorización, revisar por dominio, preservar contratos, ejecutar PostgreSQL aislado y exigir pruebas negativas/estados antes de integrar.
