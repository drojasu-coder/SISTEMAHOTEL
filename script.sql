// ===================================================
// SISTEMA DE RESERVAS - HOTEL NETO
// Capa 1: Nucleo (usuarios, sucursales, habitaciones, parqueos, pagos)
// Capa 2: Modulos (eventos, restaurante, actividades, amenidades,
//                   bienestar, parque tematico, transporte, carrito,
//                   promociones, facturacion, personal, proveedores)
// ===================================================

// ===================== CAPA 1: NUCLEO =====================

Table usuarios {
  id integer [pk, increment]
  nombre varchar(150) [not null]
  email varchar(150) [not null, unique]
  password_hash varchar(255) [not null]
  rol varchar(30) [not null, note: 'admin, recepcionista, cliente, etc.']
  telefono varchar(20)
  activo boolean [default: true]
  creado_en timestamp [default: `now()`]
}

Table sucursales {
  id integer [pk, increment]
  nombre varchar(150) [not null]
  direccion varchar(255)
  ciudad varchar(100)
  telefono varchar(20)
  activa boolean [default: true]
  creado_en timestamp [default: `now()`]
}

Table tipos_habitacion {
  id integer [pk, increment]
  nombre varchar(50) [not null, note: 'sencilla, doble, suite, familiar']
  capacidad_maxima integer [not null]
  tarifa_noche decimal(10,2) [not null]
  descripcion text
}

Table habitaciones {
  id integer [pk, increment]
  sucursal_id integer [not null, ref: > sucursales.id]
  tipo_habitacion_id integer [not null, ref: > tipos_habitacion.id]
  numero varchar(10) [not null]
  estado varchar(20) [not null, default: 'disponible', note: 'disponible, ocupada, mantenimiento, limpieza']
  creado_en timestamp [default: `now()`]

  indexes {
    (sucursal_id, numero) [unique]
  }
}

Table reservas_habitacion {
  id integer [pk, increment]
  usuario_id integer [not null, ref: > usuarios.id]
  habitacion_id integer [not null, ref: > habitaciones.id]
  fecha_entrada date [not null]
  fecha_salida date [not null]
  numero_huespedes integer [not null]
  estado varchar(20) [not null, default: 'pendiente', note: 'pendiente, confirmada, cancelada, finalizada, expirada']
  total decimal(10,2) [not null]
  creado_en timestamp [default: `now()`]
}

Table parqueos {
  id integer [pk, increment]
  sucursal_id integer [not null, ref: > sucursales.id]
  numero varchar(10) [not null]
  estado varchar(20) [not null, default: 'disponible', note: 'disponible, ocupado']
}

Table reservas_parqueo {
  id integer [pk, increment]
  reserva_habitacion_id integer [ref: > reservas_habitacion.id]
  parqueo_id integer [not null, ref: > parqueos.id]
  fecha_entrada timestamp [not null]
  fecha_salida timestamp
}

Table pagos {
  id integer [pk, increment]
  reserva_habitacion_id integer [not null, ref: > reservas_habitacion.id]
  monto decimal(10,2) [not null]
  metodo varchar(20) [not null, note: 'stripe, paypal']
  estado varchar(20) [not null, default: 'pendiente', note: 'pendiente, aprobado, rechazado']
  id_transaccion_externo varchar(150)
  creado_en timestamp [default: `now()`]
}

// ===================== CAPA 2: EVENTOS =====================

Table salones {
  id integer [pk, increment]
  sucursal_id integer [not null, ref: > sucursales.id]
  nombre varchar(100) [not null]
  capacidad_maxima integer [not null]
  tarifa_base decimal(10,2) [not null]
  descripcion text
}

Table servicios_evento {
  id integer [pk, increment]
  nombre varchar(100) [not null, note: 'catering, decoracion, audio y video, mobiliario']
  precio decimal(10,2) [not null]
}

Table reservas_evento {
  id integer [pk, increment]
  usuario_id integer [not null, ref: > usuarios.id]
  salon_id integer [not null, ref: > salones.id]
  tipo_evento varchar(50) [not null, note: 'boda, cumpleanos, ejecutivo, convivio']
  fecha date [not null]
  hora_inicio time [not null]
  hora_fin time [not null]
  numero_invitados integer [not null]
  estado varchar(20) [not null, default: 'cotizacion', note: 'cotizacion, confirmada, expirada, cancelada']
  anticipo decimal(10,2) [not null]
  total decimal(10,2) [not null]
  creado_en timestamp [default: `now()`]
}

Table reserva_evento_servicios {
  id integer [pk, increment]
  reserva_evento_id integer [not null, ref: > reservas_evento.id]
  servicio_evento_id integer [not null, ref: > servicios_evento.id]
  cantidad integer [not null, default: 1]
  subtotal decimal(10,2) [not null]
}

// ===================== CAPA 2: RESTAURANTE =====================

Table mesas {
  id integer [pk, increment]
  sucursal_id integer [not null, ref: > sucursales.id]
  zona varchar(30) [not null, note: 'interior, terraza, bar']
  capacidad integer [not null]
  estado varchar(20) [not null, default: 'disponible']
}

Table reservas_mesa {
  id integer [pk, increment]
  usuario_id integer [not null, ref: > usuarios.id]
  mesa_id integer [not null, ref: > mesas.id]
  fecha date [not null]
  hora time [not null]
  numero_comensales integer [not null]
  estado varchar(20) [not null, default: 'confirmada', note: 'confirmada, en_espera, cancelada, no_show']
  creado_en timestamp [default: `now()`]
}

// ===================== CAPA 2: ACTIVIDADES RECREATIVAS =====================

Table instructores {
  id integer [pk, increment]
  nombre varchar(150) [not null]
  especialidad varchar(50) [note: 'golf, tenis, billar']
  activo boolean [default: true]
}

Table recursos_actividad {
  id integer [pk, increment]
  sucursal_id integer [not null, ref: > sucursales.id]
  tipo varchar(30) [not null, note: 'golf, tenis, billar']
  nombre varchar(100) [not null, note: 'Cancha 1, Mesa de billar 2']
}

Table reservas_actividad {
  id integer [pk, increment]
  usuario_id integer [not null, ref: > usuarios.id]
  recurso_id integer [not null, ref: > recursos_actividad.id]
  instructor_id integer [ref: > instructores.id]
  fecha date [not null]
  hora_inicio time [not null]
  hora_fin time [not null]
  con_equipo boolean [default: false]
  estado varchar(20) [not null, default: 'confirmada']
  creado_en timestamp [default: `now()`]
}

// ===================== CAPA 2: AMENIDADES =====================

Table amenidades {
  id integer [pk, increment]
  sucursal_id integer [not null, ref: > sucursales.id]
  nombre varchar(100) [not null, note: 'piscina, toboganes, area comun']
  aforo_maximo integer [not null]
}

Table reservas_amenidad {
  id integer [pk, increment]
  usuario_id integer [not null, ref: > usuarios.id]
  amenidad_id integer [not null, ref: > amenidades.id]
  fecha date [not null]
  franja_horaria varchar(20) [not null]
  mobiliario varchar(30) [note: 'camastro, cabana, ninguno']
  codigo_qr varchar(150)
  estado varchar(20) [not null, default: 'confirmada']
}

// ===================== CAPA 2: BIENESTAR (SPA) =====================

Table terapeutas {
  id integer [pk, increment]
  nombre varchar(150) [not null]
  activo boolean [default: true]
}

Table servicios_bienestar {
  id integer [pk, increment]
  nombre varchar(100) [not null, note: 'masaje, sauna, jacuzzi']
  duracion_minutos integer [not null]
  precio decimal(10,2) [not null]
}

Table citas_bienestar {
  id integer [pk, increment]
  usuario_id integer [not null, ref: > usuarios.id]
  servicio_bienestar_id integer [not null, ref: > servicios_bienestar.id]
  terapeuta_id integer [ref: > terapeutas.id]
  fecha date [not null]
  hora_inicio time [not null]
  hora_fin time [not null]
  estado varchar(20) [not null, default: 'confirmada']
}

// ===================== CAPA 2: PARQUE TEMATICO =====================

Table boletos_parque {
  id integer [pk, increment]
  usuario_id integer [not null, ref: > usuarios.id]
  fecha_visita date [not null]
  tipo_boleto varchar(20) [not null, note: 'adulto, nino, familiar']
  precio decimal(10,2) [not null]
  codigo_qr varchar(150)
  estado varchar(20) [not null, default: 'valido']
}

// ===================== CAPA 2: TRANSPORTE =====================

Table choferes {
  id integer [pk, increment]
  nombre varchar(150) [not null]
  licencia varchar(50)
  activo boolean [default: true]
}

Table vehiculos {
  id integer [pk, increment]
  tipo varchar(30) [not null, note: 'shuttle, van, sedan']
  capacidad integer [not null]
  placa varchar(20)
}

Table reservas_transporte {
  id integer [pk, increment]
  usuario_id integer [not null, ref: > usuarios.id]
  chofer_id integer [ref: > choferes.id]
  vehiculo_id integer [ref: > vehiculos.id]
  origen varchar(150) [not null]
  destino varchar(150) [not null]
  fecha_hora timestamp [not null]
  numero_pasajeros integer [not null]
  estado varchar(20) [not null, default: 'pendiente']
}

// ===================== CAPA 2: CARRITO DE COMPRA =====================

Table carritos {
  id integer [pk, increment]
  usuario_id integer [not null, ref: > usuarios.id]
  estado varchar(20) [not null, default: 'activo', note: 'activo, pagado, expirado']
  creado_en timestamp [default: `now()`]
  expira_en timestamp
}

Table carrito_items {
  id integer [pk, increment]
  carrito_id integer [not null, ref: > carritos.id]
  tipo_item varchar(30) [not null, note: 'habitacion, evento, mesa, actividad, amenidad, bienestar, boleto_parque, transporte']
  referencia_id integer [not null, note: 'id de la fila en la tabla correspondiente segun tipo_item']
  descripcion varchar(255)
  precio decimal(10,2) [not null]
  cantidad integer [not null, default: 1]
  promocion_id integer [ref: > promociones.id, note: 'opcional, solo si se aplico un descuento a este item']
}

// ===================== CAPA 2: PROMOCIONES =====================

Table promociones {
  id integer [pk, increment]
  nombre varchar(150) [not null]
  tipo_descuento varchar(20) [not null, note: 'porcentaje, monto_fijo']
  valor_descuento decimal(10,2) [not null]
  aplica_a varchar(50) [note: 'habitacion, paquete, todo']
  fecha_inicio date [not null]
  fecha_fin date [not null]
  activa boolean [default: true]
}

// ===================== CAPA 2: FACTURACION =====================

Table configuraciones {
  id integer [pk, increment]
  porcentaje_iva decimal(5,2) [not null, default: 12, note: 'Porcentaje de IVA global vigente']
  createdAt timestamp
  updatedAt timestamp
}

Table facturas {
  id integer [pk, increment]
  usuario_id integer [not null, ref: > usuarios.id]
  nit varchar(20) [not null]
  nombre_fiscal varchar(150) [not null]
  direccion_fiscal varchar(255)
  subtotal decimal(10,2) [not null]
  iva decimal(10,2) [not null]
  porcentaje_iva decimal(5,2) [not null, note: 'Porcentaje aplicado a esta factura; no cambia históricamente']
  total decimal(10,2) [not null]
  estado varchar(20) [not null, default: 'pendiente', note: 'pendiente, emitida, anulada']
  fecha_emision timestamp
}

Table factura_items {
  id integer [pk, increment]
  factura_id integer [not null, ref: > facturas.id]
  descripcion varchar(255) [not null]
  cantidad integer [not null, default: 1]
  precio_unitario decimal(10,2) [not null]
  subtotal decimal(10,2) [not null]
}

// ===================== CAPA 2: PERSONAL =====================

Table empleados {
  id integer [pk, increment]
  usuario_id integer [not null, ref: - usuarios.id]
  sucursal_id integer [not null, ref: > sucursales.id]
  area varchar(50) [not null]
  fecha_contratacion date
}

Table turnos {
  id integer [pk, increment]
  empleado_id integer [not null, ref: > empleados.id]
  fecha date [not null]
  hora_inicio time [not null]
  hora_fin time [not null]
}

// ===================== CAPA 2: PROVEEDORES =====================

Table proveedores {
  id integer [pk, increment]
  nombre varchar(150) [not null]
  nit varchar(20)
  contacto varchar(150)
  telefono varchar(20)
  email varchar(150)
}

Table proveedor_productos {
  id integer [pk, increment]
  proveedor_id integer [not null, ref: > proveedores.id]
  nombre_producto varchar(150) [not null]
  descripcion text
}

Table cuentas_por_pagar {
  id integer [pk, increment]
  proveedor_id integer [not null, ref: > proveedores.id]
  monto decimal(10,2) [not null]
  fecha_vencimiento date [not null]
  estado varchar(20) [not null, default: 'pendiente', note: 'pendiente, pagado, vencido']
  factura_referencia varchar(100)
}
