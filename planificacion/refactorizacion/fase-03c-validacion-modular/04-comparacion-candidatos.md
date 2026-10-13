# Comparación de candidatos

`salones` tiene CRUD y validaciones mayores, relación con sucursal y uso en reservas/eventos; su acoplamiento y riesgo de regresión son superiores.

`mesas` es un catálogo aparentemente pequeño, pero aparece directamente en pruebas y flujos de reservas, por lo que tiene dependencia funcional transversal.

`configuraciones` sólo expone GET y PATCH de IVA, tiene un servicio pequeño, no usa transacciones explícitas ni relaciones cruzadas y no intersecta el trabajo conocido de José. Fue el candidato de menor riesgo.
