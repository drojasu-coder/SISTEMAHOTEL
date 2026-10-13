# Vulnerabilidades de produccion y desarrollo

| Paquete | Severidad inicial | Alcance | Ruta | Resultado |
|---|---:|---|---|---|
| `proxy-addr` | Critica | Produccion | Express 5 | Corregida a 2.0.8 |
| `qs` | Moderada | Produccion | Express/body-parser/Stripe | Corregida a 6.16.0 |
| `moment` | Moderada | Produccion | Sequelize 6 | Corregida a 2.31.0 |
| `uuid` | Moderada | Produccion | Sequelize 6 | Pendiente; fix fuerza Sequelize 3 |
| `braces` | Alta | Desarrollo | ts-node-dev -> chokidar | Pendiente; sin fix publicado |
| `brace-expansion` | Alta | Desarrollo | tooling CLI | Corregida a versiones 1.1.21/2.1.7 |

La cantidad reportada por npm puede contar varios advisories sobre la misma
familia de paquete. No se presenta el proyecto como libre de vulnerabilidades.
