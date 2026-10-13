# Duplicación

No se encontró duplicación demostrada bajo el criterio de igual entrada,
contrato, resultado y capa.

Repeticiones observadas y decisión:

- creación de conexión: helper común ya existente;
- fixtures de usuarios: pertenecen a escenarios distintos;
- limpieza: varía por foreign keys y riesgo protegido;
- validaciones HTTP y unitarias: capas diferentes;
- pagos y reservas: persistencia y reglas distintas.

No se consolidaron tests ni se redujo el conteo.
