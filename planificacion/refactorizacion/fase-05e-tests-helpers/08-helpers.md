# Helpers

Helpers existentes:

- `createIsolatedTestDatabase`;
- `clearTestTables`;
- constructor local de response en error handling;
- `validTestEnvironment` para escenarios de entorno.

El helper de conexión encapsula únicamente bootstrap técnico compartido. No se
crearon helpers productivos ni factories genéricas de usuarios, reservas o
pagos, porque sus datos y cleanup tienen propósitos distintos.
