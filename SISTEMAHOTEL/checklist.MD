# Checklist de Modelos - SISTEMAHOTEL

Orden por "PARTES": dentro de cada PARTE el orden no importa,
pero cada PARTE necesita que la anterior ya este creada primero
(porque sus tablas tienen `ref:` apuntando a tablas de la PARTE anterior).

Patron a repetir en cada tabla:
1. `npx sequelize-cli model:generate --name Nombre --attributes campo:tipo,...`
2. Revisar el archivo en migrations/ (nombre de tabla en minuscula)
3. Agregar `tableName: 'nombre_tabla'` en el modelo generado en models/
4. `npx sequelize-cli db:migrate`
5. Verificar con `docker exec -it hotel_postgres psql -U hotel_user -d hotel_db -c "\dt"`
6. Si la tabla tiene relaciones (`ref:`), agregar belongsTo/hasMany en associate()

## PARTE 1 - sin dependencias
- [x] usuarios
- [x] sucursales
- [X] tipos_habitacion
- [X] servicios_evento
- [X] instructores
- [X] terapeutas
- [X] servicios_bienestar
- [X] choferes
- [X] vehiculos
- [X] promociones
- [X] proveedores

## PARTE 2 - dependen solo de PARTE 1
- [X] habitaciones (sucursales + tipos_habitacion)
- [X] parqueos (sucursales)
- [X] salones (sucursales)
- [X] mesas (sucursales)
- [X] recursos_actividad (sucursales)
- [X] amenidades (sucursales)
- [X] empleados (usuarios + sucursales)
- [X] proveedor_productos (proveedores)
- [X] cuentas_por_pagar (proveedores)
- [X] carritos (usuarios)
- [X] facturas (usuarios)
- [X] boletos_parque (usuarios)

## PARTE 3 - dependen de PARTE 2
- [X] reservas_habitacion
- [X] reservas_evento
- [ ] reservas_mesa
- [ ] reservas_actividad
- [ ] reservas_amenidad
- [ ] citas_bienestar
- [ ] reservas_transporte
- [ ] turnos
- [ ] carrito_items
- [ ] factura_items

## PARTE 4 - dependen de PARTE 3
- [ ] reservas_parqueo
- [ ] pagos
- [ ] reserva_evento_servicios
