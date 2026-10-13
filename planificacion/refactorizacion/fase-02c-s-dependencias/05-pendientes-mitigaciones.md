# Vulnerabilidades pendientes y mitigaciones

## uuid / Sequelize

`uuid@8.3.2` permanece porque Sequelize 6.37.8 lo requiere. npm propone
`npm audit fix --force`, que degradaria Sequelize a 3.30.0. Eso es incompatible
con la arquitectura actual y esta expresamente prohibido en esta fase.

El advisory afecta usos de UUID con buffer; no se encontro uso directo de ese
API en el backend. Esto es una observacion de alcance, no una afirmacion de
inexplotabilidad. Mitigacion: mantener Sequelize 6, no aceptar buffers
controlados externamente en utilidades propias y revisar una actualización
futura de Sequelize.

## braces / ts-node-dev

`braces@3.0.3` queda en una dependencia de desarrollo y npm indica que no hay
fix disponible. No forma parte del bundle de produccion. Mitigacion: no usar
patrones glob controlados por usuarios en scripts y revisar reemplazo de
`ts-node-dev` en una fase de tooling separada.
