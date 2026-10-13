# Problemas arquitectónicos confirmados

No se confirmó un defecto de producción de bajo riesgo que requiriera refactorizar reglas o mover infraestructura. Sí se confirmó una deuda estructural: el escaneo OpenAPI y la composición modular usan ubicaciones distintas, lo que obliga a adapters.

También existe dependencia CommonJS directa de `src/models` en services modulares. Es consistente con el proyecto actual, pero no se cambia en esta fase porque modificar la carga de modelos puede afectar inicialización Sequelize y pruebas.
