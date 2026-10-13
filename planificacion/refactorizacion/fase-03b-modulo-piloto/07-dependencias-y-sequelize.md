# 7. Dependencias y Sequelize

No se añadieron dependencias ni se modificaron `package.json` o `package-lock.json`.

El servicio modular mantiene la carga dinámica actual de `src/models/index.js` y usa `Sucursal` y `Habitacion` existentes. No se movieron modelos, asociaciones, migraciones ni configuración Sequelize. El conteo de habitaciones antes de borrar una sucursal permanece igual.

La dirección de dependencia es:

`app → modules/sucursales/routes → legacy documented route → modules controller/validator → modules service → existing models`.

El adaptador transitorio existe para que Swagger continúe escaneando las rutas antiguas. No hay dos servicios activos. El análisis estático posterior no mostró un ciclo nuevo confirmado.

