# 07 — Sequelize y UUID

`sequelize@6.37.8` es dependencia runtime y se usa en modelos, servicios,
migraciones y pruebas PostgreSQL. Su árbol contiene `uuid@8.3.2`.

`npm audit` reporta la vulnerabilidad de `uuid` como vulnerabilidad transitiva
de Sequelize. El fix sugerido por npm es degradar a `sequelize@3.30.0`, un
cambio mayor incompatible y no aceptable para esta fase.

Conclusión: conservar Sequelize y documentar la deuda; no instalar una versión
incompatible ni forzar overrides del lockfile.

