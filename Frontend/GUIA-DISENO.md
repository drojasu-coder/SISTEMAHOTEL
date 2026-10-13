# GUÍA DE DISEÑO — Hotel Hunahpú (mockups en Pencil)

## 1. Reglas generales

- Archivo: Frontend/diseno-hotel.pen. Stack final: React + Tailwind.
- Idioma: español, trato de "usted". Moneda: quetzales (Q) con formato Q1,234.00.
- Fuente de verdad del backend: backend/script.sql y los modelos. Si una pantalla
  necesita algo que NO existe, se dibuja completa y se marca con la insignia
  amarilla "Backend pendiente · B## · detalle corto". Las pendientes están en la sección 8.
- Sin FEL: toda factura es "Factura de prueba. Documento sin validez tributaria."
- Pagos con tarjeta: Stripe, pero con formulario PROPIO (campos de Stripe Elements
  estilizados). Nunca el formulario de Stripe.
- Tamaños: portal cliente 1440 de ancho y versión móvil 390; panel admin 1920x1080;
  app operativa 390.
- Nombres de frames: "ID · Nombre" (ejemplo: "CLI-10 · Resultados de habitaciones").
- Estados: cada pantalla incluye los estados de la sección 4, como frames aparte
  puestos en una fila bajo la pantalla principal y rotulados.
- No existe Socket.io todavía: lo "en vivo" se muestra como "Actualizado hace 12 s ↻"
  con botón de refrescar (pendiente B09).
- Imágenes: si la herramienta puede generar imágenes, úsalas en Home, habitaciones,
  salones, spa y parque. Si no, usa marcadores grises con el rótulo "Foto: ..." y
  proporción fija (16:9 en tarjetas, 4:3 en galerías).
- Regla de cierre de cada prompt: usa solo estilos y componentes existentes; no
  modifiques lo ya creado; usa los textos EXACTOS del catálogo de mensajes; al terminar
  toma una captura, revísala y dime qué no cumple lo pedido.

## 2. Sistema de diseño

### 2.1 Colores (variables con estos nombres)

bronze-500 #A9774A (acento) · bronze-700 #7D5632 (acción principal, texto sobre crema)
gold-300 #C4966A (solo líneas y detalles, nunca texto) · gold-100 #E9D8BF
cream-50 #FBF8F1 · cream-100 #F5F0E3
charcoal-900 #212224 · charcoal-700 #3A3F44 · charcoal-400 #8A8F94 · charcoal-200 #D9DBDD
white #FFFFFF
success #3F7D58 (fondo #E6F2EA) · warning #C98A1B (fondo #FBF1DC)
danger #B3402F (fondo #F8E4E0) · info #3D6A8A (fondo #E3EEF5)

### 2.2 Tipografía: Montserrat

Display 48/600 · H1 32/600 · H2 24/600 · H3 20/600 · Cuerpo 16/400 · Cuerpo-medio 16/500
· Cuerpo-pequeño 14/400 · Etiqueta 12/500.

### 2.3 Forma

Espaciado en múltiplos de 4. Radios: 8 (campos y botones), 16 (tarjetas), 999 (insignias).
Sombra suave de tarjeta y otra de modal. Línea de 1px gold-300 como divisor de marca.
Detalle de textil guatemalteco solo como franja fina, nunca de fondo.
Accesibilidad: contraste AA, áreas táctiles de 44px, foco visible de 2px bronze-500.

### 2.4 Logos (archivos en Frontend/, .jpg; buscar por nombre)

Cada uno va SIEMPRE sobre un fondo del mismo color que su imagen, sin deformar.

- "Logo Principal (Horizontal, Color)" 4128x1024, fondo blanco → "Logo / Horizontal" (alto de uso 40px)
- "Logo para Footer (Versión Blanca)" 4128x1024, fondo #212224 → "Logo / Blanco" (alto 40px)
- "Isotipo (Símbolo Solo, Color)" 2048x2048 con mucho margen: recortar a un cuadrado de
  aprox. x 480-1570, y 480-1570, sobre cream-100 → "Logo / Isotipo" (32, 48 y 96px)
- "Logo para Facturación PDF (Monocromo)" sobre blanco → "Logo / Factura"
- "Logo para Facturación PDF (Monocromo - Versión Blanca)" sobre #000000 → "Logo / Factura oscuro"
- "Isotipo para Impresora Térmica POS (1-bit)" sobre blanco, máximo 200px → "Logo / Ticket"
  Verificar que ningún logo muestre un borde o rectángulo de otro color.

### 2.5 Componentes (variantes y estados: normal, hover, foco, deshabilitado, error)

- Botones: primario (bronze-700, texto blanco), secundario (borde bronze-700), fantasma,
  peligro. Tamaños 48/40/32px, con y sin ícono, estado cargando.
- Campos: texto, área de texto, contraseña con ojo, buscador, select, casilla, radio,
  interruptor. Etiqueta arriba; ayuda y error debajo. Altura 48px.
- Selector de rango de fechas (2 meses, días pasados deshabilitados, rango en gold-100).
- Selector de huéspedes (adultos y niños con − y +).
- Selector de franja horaria: píldoras libre / seleccionada / llena (tachada).
- Tarjeta de servicio (imagen 16:9, título, 2 líneas, "Desde Q650", botón), con variante
  skeleton y variante horizontal.
- Tabla: encabezado fijo, hover, casillas, filtros arriba, paginación, columna de acciones.
- Pestañas, migas de pan, stepper de checkout (Carrito, Datos, Pago, Confirmación).
- Chip de sede "Hunahpú Antigua ▾" con menú de las 2 sedes.
- Indicador "Actualizado hace 12 s ↻".
- Temporizador de carrito (reloj + "14:32"; warning bajo 3 min, danger bajo 1 min).
- Insignia amarilla "Backend pendiente": dos líneas (código B## y detalle técnico).
- Íconos de línea fina (estilo Lucide, trazo 1.5).

### 2.6 Insignias de estado (ícono + texto, nunca solo color)

- Reservas: Pendiente, Confirmada, Cancelada, Cotización, Cancelación solicitada\*
- Pagos: Pendiente, Procesando, Aprobado, Rechazado, Reembolsado, Reembolsado parcial
- Habitaciones: Disponible, Ocupada, Mantenimiento, Limpieza
- Parqueos: Disponible, Ocupado
- Boletos: Válido, Usado, Cancelado
- Facturas: Pendiente, Pagada, Anulada
- Cuentas por pagar: Pendiente, Pagada, Vencida
- Carrito: Activo, Procesado, Expirado
- Choferes e instructores: Activo, Inactivo
  (\*estado inexistente hoy: B04)

## 3. Plantillas

### 3.1 Portal cliente

Header blanco fijo: Logo / Horizontal a la izquierda; menú central (Habitaciones, Eventos,
Restaurante, Actividades, Amenidades, Spa, Parque, Transporte, Promociones); a la derecha
chip de sede, carrito con contador, botón "Ingresar" (avatar con sesión). Zona de banners
bajo el header. Contenido de máx. 1200px. Footer charcoal-900 con Logo / Blanco, cuatro
columnas (Hotel, Servicios, Ayuda, Contacto), las dos sedes con dirección y teléfono, y
franja fina de textil arriba. Móvil: header compacto con isotipo, menú hamburguesa y barra
inferior fija (Inicio, Buscar, Carrito, Mi cuenta). El menú de servicios es dinámico:
solo muestra lo que ofrece la sede elegida (el Parque solo existe en Atitlán).

### 3.2 Panel administrativo (1920x1080)

Menú lateral de 264px en charcoal-900 con Logo / Blanco, secciones colapsables con íconos.
Arriba del menú: selector de sede con "Todas las sedes" (solo admin) o etiqueta fija de sede
(los demás roles). Cabecera blanca: migas, buscador global, "Actualizado hace…", campana,
nombre y rol del usuario. Contenido sobre cream-50 con zona de banners.
Variantes del menú por rol:

- admin: todo.
- recepcionista (sede fija): Reservas de habitación, Parqueo, Eventos (estado), Pagos y
  transferencias, Facturas.
- gerente_habitaciones (sede fija): lo de recepción más Habitaciones y Tipos.
- gerente_restaurante (sede fija): Mesas y Reservas de mesa.
- Solo admin ven: Actividades, Amenidades, Spa, Parque, Transporte, Proveedores, Personal,
  Promociones, Reportes, Métricas, Sistema.

### 3.3 App operativa móvil (390)

Cabecera con etiqueta de sede fija, nombre del empleado y turno. Tarjetas grandes, botones
de 56px, barra inferior (Mis tareas, Turnos, Perfil).

## 4. Estados de pantalla

- C Cargando (skeleton, no spinner) · R Error de red o servidor con "Reintentar"
- V Vacío (con acción sugerida) · S Sin conexión (banner fijo)
- X Sin permiso · T Sesión expirada (modal) · F "Actualizado hace X s"
  Toda pantalla lleva C y R. En cada pantalla del mapa solo se anotan los adicionales.

## 5. Catálogo de mensajes (textos exactos, con ortografía correcta)

Componentes: Toast éxito (verde, 4 s), Toast error (rojo, permanece), Toast info (azul, 5 s),
Mensaje en línea (bajo el campo), Banner fijo, Modal de confirmación, Pantalla de resultado,
Estado vacío. Nunca se muestran códigos técnicos. Nunca se culpa al usuario.

CUENTA

- Login correcto · toast éxito · "Bienvenida, {nombre}." (usar "Bienvenido" o "Bienvenida" según el nombre del dato de prueba)
- Credenciales incorrectas · en línea · "Correo o contraseña incorrectos. Intente de nuevo."
- Cuenta bloqueada (B05) · banner · "Por seguridad, bloqueamos su cuenta por 15 minutos. Puede restablecer su contraseña ahora."
- Registro completado · pantalla · "Cuenta creada. Ya puede iniciar sesión." (con verificación de correo, B05: "Le enviamos un enlace de verificación a {correo}.")
- Correo ya registrado · en línea · "Este correo ya tiene una cuenta. ¿Desea iniciar sesión?"
- Contraseña débil · en línea · "Use al menos 8 caracteres, con una mayúscula, un número y un símbolo."
- Código 2FA incorrecto (B05) · en línea · "El código no es correcto. Revise e intente de nuevo."
- Código enviado (B05) · toast info · "Enviamos un código de 6 dígitos a su correo."
- Recuperación (B05) · pantalla · "Si el correo está registrado, recibirá un enlace para restablecer su contraseña."
- Contraseña actualizada (B05) · toast éxito · "Su contraseña fue actualizada."
- Sesión expirada · modal · "Su sesión expiró por seguridad. Inicie sesión para continuar."
- Cierre de sesión · toast info · "Cerró sesión correctamente."
- Perfil guardado · toast éxito · "Sus cambios se guardaron correctamente."

BÚSQUEDA Y CARRITO

- Fechas inválidas · en línea · "La salida debe ser posterior a la entrada."
- Excede capacidad · en línea · "Esta habitación admite hasta {n} huéspedes."
- Sin disponibilidad · estado vacío · "No hay habitaciones disponibles en esas fechas. Estas opciones son similares:"
- Agregado al carrito · toast éxito · "Agregado al carrito. Lo retenemos por 15 minutos."
- Carrito por vencer · banner · "Su carrito vence en 2 minutos. Complete el pago para conservar su reserva."
- Carrito vencido · pantalla · "Su carrito venció y liberamos las reservas. Puede volver a buscar."
- Ítem ya no disponible · toast error · "\"{ítem}\" ya no está disponible y lo quitamos del carrito."
- Ítem eliminado · toast info · "Eliminado del carrito." + acción "Deshacer" (solo visual)
- Cambio de sede con carrito lleno · modal · "Su carrito tiene reservas de {sede A}. Para agregar algo de {sede B} debe vaciarlo." [Cancelar] [Vaciar y continuar]
- Promoción aplicada · toast éxito · "Promoción \"{nombre}\" aplicada: −Q{monto}."
- Promoción no vigente · en línea · "Esta promoción ya no está vigente."
- Promoción incompatible · en línea · "Esta promoción no se puede combinar con la que ya aplicó."

DATOS FISCALES Y PAGO

- NIT inválido · en línea · "El NIT no es válido. Revise el número o use CF."
- Datos fiscales guardados (B22) · toast éxito · "Datos de facturación guardados."
- Procesando · pantalla · "Estamos procesando su pago. No cierre esta ventana."
- Pago aprobado · pantalla · "¡Pago realizado! Su reserva está confirmada. Le enviamos el comprobante a {correo}." (correo: B13)
- Pago rechazado · pantalla · "Su banco rechazó el pago. No se hizo ningún cobro. Pruebe con otra tarjeta."
- Fondos insuficientes · en línea · "Fondos insuficientes. Pruebe con otra tarjeta."
- Tarjeta vencida · en línea · "Esta tarjeta está vencida."
- Datos de tarjeta incompletos · en línea · "Revise el número, la fecha y el código de seguridad."
- Tiempo agotado · pantalla · "Tardamos más de lo esperado y no vimos la confirmación. Su reserva sigue retenida. Puede reintentar sin riesgo de doble cobro."
- 3D Secure fallido · pantalla · "No se pudo verificar su identidad con el banco. Intente de nuevo."
- Transferencia elegida · pantalla · "Reserva registrada. Realice la transferencia por Q{monto} indicando la referencia {código}."
- Transferencia pendiente · banner · "Estamos verificando su transferencia. Le avisaremos cuando se confirme."
- Efectivo elegido · pantalla · "Reserva registrada. Pague Q{monto} en recepción antes del {fecha}."
- Pago pendiente de aprobación · pantalla · "Su pago está pendiente de aprobación. Todavía no se realizó ningún cobro."
- Reserva pendiente de pago · banner · "Reserva pendiente de pago. Tiene hasta las {hora} para completarla."

RESERVAS POR MÓDULO

- Reserva confirmada · pantalla · "Reserva confirmada. Su código es {código}."
- Mesa reservada · pantalla · "Mesa reservada para {n} personas, {fecha} a las {hora}."
- Sin mesas · estado · "No hay mesas a esa hora. Podemos avisarle si se libera una." [Unirme a la lista] (B12)
- Lista de espera (B12) · toast info · "Está en la lista de espera. Le avisaremos por correo."
- Horario ocupado · en línea · "Ese horario ya está ocupado. El siguiente disponible es a las {hora}."
- Aforo lleno · estado · "Esta franja alcanzó su aforo máximo. Elija otra franja."
- Boletos agotados · estado · "Los boletos para esa fecha se agotaron. Fechas cercanas con cupo:"
- Evento: invitados exceden · en línea · "Este salón admite hasta {n} invitados."
- Evento: fecha ocupada · estado · "El salón no está disponible ese día. Fechas alternas:"
- Cotización generada · pantalla · "Su cotización está lista. Reserve su fecha pagando el anticipo del {porcentaje}%."
- Evento confirmado · pantalla · "¡Evento confirmado! Recibimos su anticipo de Q{monto}."
- Saldo por vencer · banner · "Le recordamos que el saldo de Q{monto} vence el {fecha}."
- Pago vencido · banner · "Su pago está vencido. Contáctenos para regularizarlo o su reserva podría cancelarse."
- Traslado pendiente · estado · "Su traslado está registrado. Le asignaremos chofer y vehículo pronto."
- Traslado confirmado · pantalla · "Traslado confirmado. Su chofer será {nombre}."
- QR listo · toast éxito · "Su código QR está listo. Preséntelo en la entrada."
- QR inválido (personal) · pantalla · "Código no válido o ya utilizado."

CANCELACIONES Y REEMBOLSOS

- Solicitar cancelación (B04) · modal · "¿Solicitar la cancelación de esta reserva? Nuestro equipo revisará su solicitud y le informará el reembolso que corresponde según la política." [Mantener reserva] [Solicitar cancelación]
- Solicitud enviada (B04) · toast éxito · "Recibimos su solicitud. Le responderemos pronto."
- Reembolso (personal) · modal · "¿Reembolsar Q{monto} de este pago? Esta acción no se puede deshacer." [Cancelar] [Reembolsar]
- Reembolso procesado (personal) · toast éxito · "Reembolso de Q{monto} registrado."
- Excede saldo (personal) · en línea · "El monto supera lo que se puede reembolsar (Q{máximo})."
- Cancelación registrada (personal) · toast éxito · "Reserva cancelada."

FACTURAS Y DOCUMENTOS

- Factura creada · toast éxito · "Factura HUN-{número} creada."
- Factura anulada · toast info · "Factura HUN-{número} anulada."
- No se puede facturar · en línea · "Solo se pueden facturar reservas pagadas."
- Etiqueta en toda factura · "Factura de prueba. Documento sin validez tributaria."
- Descarga lista (B07) · toast éxito · "Su documento se descargó."
- Exportación (B02) · toast éxito · "Reporte exportado a {PDF/Excel}."
- Reporte lento (B02) · toast error · "El reporte tardó demasiado. Reduzca el rango de fechas e intente de nuevo."

SISTEMA

- Sin internet · banner · "Sin conexión. Algunas funciones no están disponibles."
- Modo local de recepción · banner · "Sin conexión. Sus registros se guardan en este equipo y se enviarán al reconectar."
- Reconexión · toast éxito · "Conexión restablecida. Sincronizamos {n} registros."
- Error del servidor · pantalla · "Algo salió mal de nuestro lado. Ya estamos trabajando en ello." [Reintentar]
- Sin permiso · pantalla · "No tiene permiso para ver esta sección. Si cree que es un error, contacte a un administrador."
- Página no encontrada · pantalla · "No encontramos esta página." [Volver al inicio]
- Datos en caché · banner · "Mostrando la última información disponible. Actualizando…"

PERSONAL

- Check-in completado · toast éxito · "Check-in de {huésped} en la habitación {n}."
- Faltan datos · en línea · "Complete la identificación y los datos de contacto para continuar."
- Habitación bloqueada reservada · banner admin · "Alerta: la habitación {n} está en mantenimiento y tiene una reserva. Revise de inmediato."
- Habitación disponible · toast éxito · "Habitación {n} lista y disponible."
- Conflicto de mesas · modal · "Dos reservas coinciden en la mesa {n}. Reasigne una para continuar."
- Conflicto de turnos · en línea · "{empleado} ya tiene un turno en ese horario."
- Empleado agregado · toast éxito · "{nombre} se agregó al personal de {sede}."
- Sin permiso para editar · toast error · "Solo el administrador puede hacer este cambio."
- Transferencia aprobada · toast éxito · "Transferencia aprobada. La reserva quedó confirmada."
- Transferencia rechazada · modal · "¿Rechazar esta transferencia? Se avisará al cliente y se liberará la reserva."
- Pago en efectivo registrado · toast éxito · "Pago en efectivo registrado. Reserva confirmada."
- Cuenta por pagar vencida · banner · "{n} pagos a proveedores están vencidos." [Ver]
- Promoción creada/desactivada · toast éxito · "Promoción \"{nombre}\" creada." / "...desactivada."
- Métrica con pocos datos (B02) · banner · "Pocos datos para este cálculo. Tome el resultado como referencia."
- Guardado genérico · toast éxito · "Cambios guardados."
- Eliminar · modal · "¿Eliminar \"{nombre}\"? Esta acción no se puede deshacer."
- Chofer asignado · toast éxito · "Chofer y vehículo asignados."
- Tarea completada (operativo) · toast éxito · "Habitación {n} marcada como disponible."

## 6. Datos de prueba (usar siempre estos, para que todo cuadre)

SEDES

- Hunahpú Antigua: 4a Avenida Norte #12, Antigua Guatemala, tel. 7832-1100
- Hunahpú Atitlán: Calle Santander km 2, Panajachel, Sololá, tel. 7762-2200
  IVA 12%. Los precios incluyen IVA.

HABITACIONES (tarifa por tipo, igual en ambas sedes)
Sencilla (cap. 2) Q650 · Doble (3) Q950 · Familiar (5) Q1,450 · Suite (3) Q2,400
Antigua: 101-102 sencillas; 103-106 dobles; 107-108 familiares; 109-110 suites.
Atitlán: 201-202 sencillas; 203-205 dobles; 206 familiar; 207-208 suites.
Estados: 101 y 105 ocupadas; 104 limpieza; 108 mantenimiento; el resto disponibles.
Parqueos: A-01 a A-12 (Antigua), B-01 a B-10 (Atitlán); estados disponible/ocupado.

USUARIOS (rol)
Mariana Estrada (admin) · Luis Pérez (recepcionista, Antigua) · Jorge Tzul (gerente_habitaciones, Atitlán)
· Carmen Ixcoy (gerente_restaurante, Antigua) · Rosa Choc (empleado_operativo, Antigua)
· Clientes: Andrea Morales (principal), Carlos Ramírez, Sofía Herrera, Michael Stevens (turista).
Áreas de empleados (texto libre): Recepción, Habitaciones, Restaurante, Limpieza, Administración.

EVENTOS
Salones: Volcán (150 pers., Q8,500) y Jade (60, Q3,800) en Antigua; Lago (200, Q11,000) y
Terraza Tolimán (80, Q4,500) en Atitlán.
Servicios: Catering Q95 por persona · Decoración Q2,500 · Audio y video Q1,800 · Mobiliario Q1,200.
Caso modelo: boda de Sofía Herrera, Salón Volcán, sábado 20 de febrero de 2027, 18:00 a 23:59,
120 invitados. Salón 8,500 + catering 11,400 + decoración 2,500 + audio y video 1,800 = Q24,200.
Anticipo 50% = Q12,100 (el porcentaje lo define el hotel; viene del servidor). Saldo Q12,100
vence 3 días antes del evento.
Política de cancelación (referencia para el reembolso SUGERIDO que decide el personal):
30 días o más: 100% · 15-29: 80% · 8-14: 70% · 4-7: 50% · 1-3: 25% · día del evento: 0%.
Ejemplo: cancelar 20 días antes → penalización 20% de lo pagado; reembolso sugerido Q9,680.

RESTAURANTE: zonas interior, terraza y bar; mesas de 2, 4 y 6 personas (sin número en la
base, B16). Comida 12:00-15:00 y cena 18:00-22:00.

ACTIVIDADES (recursos: Campo de golf 9 hoyos, Cancha de tenis 1 y 2, Mesa de billar 1 y 2;
instructores: Roberto Cifuentes (golf), Daniela Soto (tenis)). Precios referenciales (B17):
golf Q350/h, tenis Q120/h, billar Q80/h, equipo Q75, instructor Q200.

AMENIDADES (Antigua y Atitlán): Piscina climatizada (aforo 40), Toboganes (25), Jardín Maya (60).
Franjas: 09:00-12:00, 13:00-16:00, 16:00-19:00. Mobiliario: camastro, cabaña, ninguno.
Precios referenciales (B17): camastro Q60, cabaña Q250, day-pass Q120.

SPA: Masaje relajante 60 min Q450 · Piedras calientes 90 min Q650 · Sauna 30 min Q150 · Jacuzzi 45 min Q200.
Terapeutas: Ana Lucía Barrios, Marco Tulio Reyes, Karla Mejía.

PARQUE TEMÁTICO "Tz'unun" (solo Atitlán; la tabla no tiene sede, B11): boleto adulto Q150,
niño Q90, familiar Q480. Aforo diario 500 (B19).

TRANSPORTE: Shuttle compartido (cap. 12, placa P-123ABC), Van (8, P-456DEF), Sedán (3, P-789GHI).
Choferes: Hugo Alvarado (licencia A-45821), Byron Tzoc (licencia A-39107).
Ruta principal: Aeropuerto La Aurora → Hunahpú Antigua. Precios referenciales (B17):
shuttle Q120 por persona, van Q850, sedán Q550.

PROMOCIONES (tipo_descuento porcentaje o monto_fijo; aplica_a habitacion, paquete o todo)

- Escapada Maya: 10% a habitación, 1 oct al 15 dic 2026
- Festival de Barriletes Gigantes: 10% a habitación, 25 oct al 3 nov 2026
- Fin de año: Q200 de monto fijo, 26 dic 2026 al 2 ene 2027 (aplica_a todo)

CARRITO MODELO de Andrea Morales (Antigua):
Habitación doble 105, 12 al 15 de noviembre de 2026 (3 noches) Q2,850 · Masaje relajante Q450 ·
Shuttle aeropuerto, 2 pasajeros Q240 · Promoción Escapada Maya −Q285.
Total Q3,255.00 = subtotal Q2,906.25 + IVA 12% Q348.75. Los totales los calcula el servidor.

PAGOS: pago de Andrea con tarjeta (Stripe), id de transacción pi_3PxExample. Pagos de ejemplo
en estados pendiente (transferencia de Carlos Ramírez, Q1,450), procesando, aprobado,
rechazado (fondos insuficientes) y reembolsado parcial (Q500 de Q2,850).
Resumen por carrito (campos reales): total, anticipo_requerido, aprobado, saldo.

FACTURAS (No. = HUN-000123, formato HUN-{id}): factura a Andrea Morales, NIT 4567891-2,
dirección "5a Calle Poniente #8, Antigua Guatemala", estados pendiente, pagada y anulada.

PROVEEDORES (nombre, nit, contacto, teléfono, email): Distribuidora La Antigüeña, S.A.
(alimentos) · Lavandería Industrial Quetzal · Mantenimiento Técnico GT. Cuentas por pagar con
factura_referencia FAC-2201, en estados pendiente, vencida y pagada.

TURNOS: Luis Pérez 06:00-14:00 y 14:00-22:00 (lunes a viernes).

## 7. Mapa de pantallas (ID · nombre — contenido · estados extra · pendientes)

Cada reserva del cliente primero se crea en estado "pendiente" y luego se agrega al
carrito (tipos de ítem: habitacion, evento, transporte, actividad, amenidad, mesa,
boleto_parque, cita_spa). El cliente solo ve sus propias reservas.

### A. Portal cliente (CLI)

- CLI-00 · Elegir sede — dos tarjetas grandes con foto.
- CLI-01 · Home — buscador (sede, fechas, huéspedes), promociones, habitaciones, servicios de
  la sede, sedes, footer · V "No hay promociones vigentes por ahora." · B01
- CLI-02 · Promociones — lista y detalle (nombre, tipo, valor, vigencia, aplica a).
- CLI-03 · Calendario de precios (plus, mapa de calor de temporada alta y baja) · B01, B02
- CLI-04 · Ficha de sede — fotos, mapa, contacto, servicios que ofrece.
- CLI-10 · Resultados de habitaciones — filtros (tipo, capacidad), tarjetas con tarifa · V · B01, B06
- CLI-11 · Detalle de habitación — galería, descripción, tarifa, calendario · B01, B06
- CLI-12 · Configurar reserva — fechas, huéspedes, parqueo opcional, resumen con total calculado
  por el servidor ("Calculando…") · B01
- CLI-13 · Sin disponibilidad — alternativas similares. Conflicto 409 del servidor.
- CLI-20 · Salones — capacidad, tarifa base, fotos · B06
- CLI-21 · Detalle de salón + calendario · B01
- CLI-22 · Solicitar cotización — tipo (boda, cumpleaños, ejecutivo, convivio), fecha, hora
  inicio y fin, invitados, servicios adicionales con cantidad · errores de capacidad y de fecha ocupada
- CLI-23 · Cotización — desglose, anticipo (anticipo_requerido), política de pagos y de cancelación
  visibles antes de pagar · B20
- CLI-24 · Gestionar mi evento — anticipo pagado, saldo, fecha límite, estados cotización/confirmada/
  cancelada, "Solicitar cancelación" · B04, B20
- CLI-30 · Reservar mesa — fecha, hora, comensales, zona · mesa no disponible · B01, B12
- CLI-31 · Confirmación de mesa.
- CLI-40 · Actividades — golf, tenis, billar · B06, B17
- CLI-41 · Reservar horario — recurso, instructor opcional, equipo, fecha, inicio y fin · B01, B17, B23
- CLI-50 · Amenidades — aforo por franja · B01, B06, B17
- CLI-51 · Reservar franja — mobiliario · aforo lleno · B01, B12, B18
- CLI-52 · Pase QR de la amenidad.
- CLI-60 · Servicios de spa — duración y precio (no tiene descripción en la base).
- CLI-61 · Terapeuta y horario — terapeuta o "asignar automáticamente"; hora_fin se calcula · B01, B11, B12
- CLI-70 · Boletos del parque (solo Atitlán) — fecha, tipo (adulto, niño, familiar) · B01, B19
- CLI-71 · Boleto digital QR — estados válido, usado, cancelado.
- CLI-80 · Cotizar traslado — origen, destino, fecha y hora, pasajeros.
- CLI-81 · Confirmación de traslado — estado pendiente, "Chofer por asignar" · B11, B17
- CLI-82 · Mi traslado — chofer y vehículo asignados por el hotel.
- CLI-90 · Carrito — ítems de todos los módulos, promociones vigentes con botón "Aplicar",
  desglose (subtotal, IVA 12%, total), temporizador 15:00 · modal de cambio de sede · ítem retirado · B11
- CLI-91 · Checkout 1: datos fiscales (NIT, nombre fiscal, dirección) · B22
- CLI-92 · Checkout 2: elegir método (Tarjeta, Transferencia, Efectivo); para eventos, pago total o anticipo
- CLI-92A · Tarjeta — formulario propio (número, vencimiento, CVC, titular), resumen, temporizador;
  "Guardar tarjeta" · B22
- CLI-92B · Transferencia — datos bancarios del hotel (ficticios), monto exacto, referencia sugerida,
  "Adjuntar comprobante (opcional)" · B10
- CLI-92C · Efectivo — "Pague en recepción" con fecha límite.
- CLI-93 · Procesando y verificación 3D Secure (espera la confirmación del servidor).
- CLI-94 · Confirmación de pago — resumen, códigos QR, "Descargar comprobante" · B07
- CLI-95 · Pago rechazado o tiempo agotado — reintento sin duplicar cobro.
- CLI-96 · Carrito expirado.
- CLI-97 · Pago pendiente de aprobación (transferencia o efectivo).
- CLI-A0 · Iniciar sesión · bloqueo tras intentos (B05) · después del login el sistema consulta
  quién es el usuario y lo lleva a su portal o panel según el rol.
- CLI-A1 · Registro (nombre, correo, teléfono, contraseña).
- CLI-A2 · Verificar correo · B05
- CLI-A3 · Verificación en dos pasos · B05
- CLI-A4 y CLI-A5 · Recuperar y restablecer contraseña · B05
- CLI-B0 · Mi cuenta / Mi estadía (plus: itinerario con todos los QR).
- CLI-B1 · Mis reservas — todos los módulos, filtros por estado y sede.
- CLI-B2 · Detalle de reserva — QR, estado, pagos y saldo.
- CLI-B3 · Solicitar cancelación · B04
- CLI-B4 · Mis facturas · B07
- CLI-B5 · Detalle de factura de prueba · B07
- CLI-B6 · Datos fiscales guardados · B22
- CLI-B7 · Métodos de pago guardados · B22
- CLI-B8 · Perfil y seguridad (nombre, teléfono, cambio de contraseña) · B05

### B. Administración (ADM, REC)

- ADM-01 · Login de personal (mismo login; redirige según rol).
- ADM-02 · Dashboard — reservas del día, llegadas y salidas, ocupación, gráficas (activas, canceladas,
  pendientes), pagos por aprobar · B02, B09
- ADM-03 · Reservas unificadas — listado con filtros por módulo, estado y sede; cambio de estado
  según permisos.
- REC-01 · Llegadas y salidas del día · B15
- REC-02 · Check-in (datos del huésped, asignación de habitación, parqueo) · B15
- REC-03 · Check-out y cobro; crea factura de prueba · B07, B15
- REC-04 · Reserva de mostrador (habitaciones: el rol puede crear; otros módulos: B08)
- REC-05 · Modo sin conexión (estado principal S, guardado local) · B09
- REC-06 · Cobro en efectivo (registra el pago).
- ADM-10 · Mapa de habitaciones por estado (disponible, ocupada, mantenimiento, limpieza), F
- ADM-11 · Tipos y tarifas (alta y edición: nombre, capacidad máxima, tarifa por noche, descripción).
- ADM-12 · Parqueos — mapa de espacios (disponible/ocupado) y reservas de parqueo.
- ADM-13 · Calendario de ocupación — alerta de habitación bloqueada reservada · B01
- ADM-20 · Reservas de eventos — cotización, confirmada, cancelada.
- ADM-21 · Detalle de evento — servicios, anticipo, saldo, pagos, reembolso.
- ADM-22 · Salones y servicios de evento (alta y edición).
- ADM-30 · Mapa de mesas — por zona, estados, F · B16
- ADM-31 · Reservas de mesa del día — confirmar, cancelar · B12
- ADM-32 · Configuración de mesas (zona, capacidad).
- ADM-33 · Ventas de platillos y bebidas · B24
- ADM-40 · Agenda de actividades por recurso e instructor (solo admin) · B01
- ADM-41 · Recursos e instructores (alta y edición).
- ADM-50 · Aforo de amenidades por franja · B01
- ADM-51 · Validar QR (tablet en la puerta; resultado válido o "Código no válido o ya utilizado.")
- ADM-52 · Configuración de amenidades (nombre, aforo máximo) · B17, B18
- ADM-60 · Agenda de spa por terapeuta · B01, B11
- ADM-61 · Servicios de spa y terapeutas (alta y edición).
- ADM-70 · Boletos del parque — ventas y estados · B19
- ADM-71 · Validar boleto QR.
- ADM-80 · Reservas de transporte pendientes de asignar.
- ADM-81 · Asignar chofer y vehículo (verifica capacidad de pasajeros).
- ADM-82 · Flota y choferes (alta, edición, activo/inactivo) · B11
- ADM-90 · Promociones (lista con estado activa/vencida).
- ADM-91 · Crear o editar promoción (nombre, tipo de descuento, valor, aplica a, fechas, activa) · B21
- ADM-A0 · Facturas (lista) · ADM-A1 · Crear factura (usuario, NIT, nombre fiscal, dirección, ítems;
  el IVA se calcula con el % de configuración) · ADM-A2 · Detalle de factura de prueba y anular · B07
- ADM-B0 · Pagos (lista con filtros por estado y método) · ADM-B1 · Detalle de pago (errores de Stripe,
  idempotencia, reembolsos acumulados) y reembolso con monto sugerido editable ·
  ADM-B2 · Transferencias por aprobar (aprobar o rechazar, ver comprobante B10)
- ADM-C0 · Personal (lista) · ADM-C1 · Alta y edición de empleado (usuario, sede, área, fecha de
  contratación) · ADM-C2 · Turnos por semana, con alerta de conflicto · B25
- ADM-D0 · Proveedores · ADM-D1 · Detalle (productos, contacto, NIT) · ADM-D2 · Cuentas por pagar
  (pendiente, pagada, vencida) con alertas de vencimiento.
- ADM-E0 · Centro de reportes con exportar a PDF y Excel · ADM-E1 Ocupación · E2 Ingresos mensuales ·
  E3 Servicios más vendidos · E4 Personal · E5 Contabilidad y financiero (estados de cuenta,
  proveedores, acreedores, balances) · E6 Reservas (activas, canceladas, en espera) · B02
- ADM-F0 · Métricas de decisión (cancelaciones, recurrencia, recomendaciones de promoción) ·
  ADM-F1 · Temporadas altas y bajas · ADM-F2 · Comparativo entre sedes (plus) · B02
- ADM-G0 · Usuarios · ADM-G1 · Crear usuario del personal (rol y sede) · ADM-G2 · Matriz de roles y
  permisos · ADM-G3 · Sucursales (alta y edición, activa/inactiva) · B03, B14
- ADM-H0 · Configuración (IVA, porcentaje de anticipo, plazos, política de cancelación) · B20

### C. Operativas móviles (OPE)

- OPE-01 · Mis habitaciones por limpiar (estado limpieza de su sede) · B03, B14
- OPE-02 · Marcar como disponible (confirmación) · B14
- OPE-03 · Mis turnos
- OPE-04 · Soporte a huéspedes · B24
- OPE-10 · Mis traslados (solo choferes) · B14

### D. Transversales

- TRA-01 a TRA-06: 404, 500, sin conexión, sesión expirada, sin permiso, en mantenimiento.
- EML-01 a EML-06: confirmación de reserva, recordatorio, recuperar contraseña, pago rechazado o
  carrito abandonado, verificar correo, solicitud de cancelación · B13
- DOC-01 Factura de prueba en PDF (Logo / Factura, NIT, detalle, IVA, etiqueta de prueba) ·
  DOC-02 Comprobante de pago · DOC-03 Ticket térmico de 80 mm (Logo / Ticket) ·
  DOC-04 Boleto QR del parque · DOC-05 Pase QR de amenidad · B07

## 8. Pendientes de backend (códigos usados en las insignias)

B01 Endpoints de disponibilidad (habitaciones libres por fechas, cupo de amenidades por franja, mesas
libres, horarios libres de actividades y spa, aforo diario del parque). Hoy solo se rechaza con 409 al reservar.
B02 Dashboard, reportes y métricas (no existe ningún endpoint).
B03 Filtro por sede del empleado autenticado; /auth/me debe devolver sucursal_id y área; el JWT no trae rol.
B04 Solicitud de cancelación del cliente (hoy no puede cancelar) y reembolso sugerido por política.
B05 Recuperar y cambiar contraseña, 2FA, verificación de correo, refresh token, logout y bloqueo por intentos.
B06 Subida de imágenes (S3) y campos de imagen en habitaciones, salones, amenidades, actividades y spa.
B07 PDF de facturas y comprobantes; vínculo factura-pago; el cliente ve sus facturas.
B08 Reserva de mostrador: recepción reserva a nombre de un cliente en módulos distintos a habitaciones.
B09 Socket.io (estados en vivo) y modo sin conexión con sincronización.
B10 Comprobante o referencia de transferencia.
B11 sucursal_id en terapeutas, servicios_bienestar, vehiculos, choferes, instructores, reservas_transporte,
boletos_parque, facturas y carritos.
B12 Lista de espera (mesas, amenidades, spa, transporte).
B13 Notificaciones y correos (confirmaciones, recordatorios, carrito abandonado).
B14 Permisos de gestión por rol para actividades, amenidades, spa, parque y transporte (hoy solo admin);
el empleado_operativo debe poder cambiar el estado de habitaciones y ver sus turnos.
B15 Check-in y check-out reales y estados finalizada, expirada y no show en reservas.
B16 Mesas: número o etiqueta, posición X/Y para el mapa y duración del turno.
B17 Tarifas de actividades, amenidades (mobiliario y day-pass), transporte y parqueo.
B18 Amenidades: número de personas por reserva y franjas configurables.
B19 Parque: aforo diario por sede y cantidad de boletos por compra.
B20 Configuración ampliada: porcentaje de anticipo (hoy variable de entorno), plazo del saldo, política de
cancelación y penalizaciones, tolerancia de no-show.
B21 Promociones: código, paquetes, incompatibilidades y sede.
B22 Datos fiscales y tarjetas guardadas (stripe_customer_id).
B23 Recurrencia y edad mínima en actividades; bitácora de cancelaciones tardías.
B24 Menú de restaurante, ventas por platillo, soporte a huéspedes, reseñas y lealtad.
B25 Asistencia y desempeño del personal.
