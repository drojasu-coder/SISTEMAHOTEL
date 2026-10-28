# Catálogo comercial de las 4 sedes — carga de datos

Mecanismo: `backend/scripts/seed-commercial-catalog.ts` (idempotente, transacción por bloque y sede, simulación por defecto).

```bash
# Simulación (ejecuta y revierte todo)
cd backend && NODE_ENV=development npx ts-node --transpile-only scripts/seed-commercial-catalog.ts \
  --expect-db=hotel_db --expect-port=5432 --report=/ruta/informe.json
# Aplicar
... --apply
```

- Aborta si la base o el puerto de `DATABASE_URL` no coinciden con `--expect-db` / `--expect-port`. No imprime credenciales.
- No borra registros ni modifica reservas, pagos o usuarios. Reutiliza los equivalentes existentes y solo crea lo que falta.
- Una segunda ejecución no crea nada (comprobado en la base aislada y en `hotel_db`).
- Respaldo previo a la aplicación en desarrollo: `backend/backups/hotel_db_pre_catalogo_comercial_apply_20261027_055142.dump` (ignorado por Git).

## Decisiones impuestas por el esquema actual

| Tema | Esquema | Decisión |
|---|---|---|
| Tarifa por sede | `tipos_habitacion` es global, con una sola `tarifa_noche` | 7 tipos por sede (`Deluxe King · Antigua`…): 28 tipos, para conservar el motor de reservas sin migraciones |
| Unidades iniciales (101–403) | Tipos `Individual`, `Doble` y `Suite` | Se conservan y pasan a `Deluxe Twin`, `Deluxe King` y `Suite` de su sede. La capacidad nunca baja y las reservas guardan su propio `total` |
| Tipos iniciales | Sin unidades tras la reasignación | Se conservan sin borrar; desde la etapa 4 no aparecen en `GET /public/tipos-habitacion` (sin sede ni inventario) |
| Impuestos | El carrito cobra `tarifa_noche × noches`; solo `facturas` suma IVA al subtotal | `tarifa_noche` es el precio aprobado. La factura (módulo administrativo) añadiría IVA encima, lo que contradice "impuestos incluidos" |
| Restaurante | Etapa 2: `restaurantes` (uno por sede), `productos_menu` y `mesas.restaurante_id` | 4 restaurantes, 60 productos y las 97 mesas vinculadas. Horarios de servicio: **no modelados** |
| Amenidades | Etapa 2: `amenidades.reservable` | 15 reservables y 16 compartidas. Wi-Fi (servicio general) y estacionamiento (módulo de parqueos sin registros): no se registran |
| Bienestar | Etapa 2: `sucursal_id` en servicios y terapeutas; `servicios_bienestar.activo` | 21 servicios y 20 terapeutas vinculados a su sede. Los 4 servicios generales anteriores quedan inactivos (no se borran). Cabinas: **no modeladas** |
| Actividades | Etapa 2: modalidad `experiencia` (duración fija, cupo compartido, precio por persona) | Las 22 actividades del plan como experiencias. Los 8 recursos anteriores siguen `por_hora` sin cambios |
| Salones | `tarifa_base` es el total cotizado (+ servicios) y la reserva nace en `cotizacion` | 7 salones nuevos con tarifa base de referencia en la escala de los existentes; 5 equivalentes reutilizados sin cambios |

## Manifiesto de medios pendientes

Las fotografías reutilizadas ya estaban en S3/CloudFront y responden 200. Son ilustrativas: no representan instalaciones físicas verificadas.

| Elemento | Estado |
|---|---|
| Tipos Deluxe King y Premium (4 sedes) | Reutilizan la foto "doble" de su misma sede |
| Tipos Junior Suite y Suite (4 sedes) | Reutilizan la foto "suite" de su misma sede |
| Tipos Deluxe Twin, Suite Familiar y Suite Presidencial (4 sedes) | **Sin fotografía** |
| 19 servicios de bienestar | Reutilizan 3 fotos generales (masaje, aromaterapia, facial). Sus créditos de origen devuelven 404: **licencia por verificar** |
| Exfoliación corporal · Atitlán, Reflexología · Capital | **Sin fotografía** |
| 22 experiencias del plan | **Sin fotografía** |
| 4 restaurantes y 60 productos del menú | Los restaurantes pueden usar `restaurante_imagen_key` de su sede; productos **sin fotografía** |
| 19 amenidades nuevas | **Sin fotografía** |
| 7 salones nuevos | **Sin fotografía** |

## Etapa 2 — Contrato para integrar en el frontend

Migraciones aditivas (`backend/src/migrations/20261027010000…040000`), probadas con subida, bajada y nueva subida en una copia aislada.

### Bienestar
- `GET /api/servicios-spa?sucursal_id=N`: servicios activos de la sede. Sin parámetro: todos los activos. `incluir_inactivos=true`: también los retirados.
- `GET /api/terapeutas?sucursal_id=N`: terapeutas de la sede. Cada registro incluye `sucursal_id` y `Sucursal {id, nombre}`.
- `POST /api/citas-spa` responde **422 `THERAPIST_BRANCH_MISMATCH`** si el terapeuta no es de la sede del servicio, y **422 `WELLNESS_SERVICE_INACTIVE`** si el servicio está retirado. El descanso de 15 min (`THERAPIST_BUSY_OR_BUFFER`) se mantiene.
- El formulario público de cita filtra los terapeutas por `servicio.sucursal_id`.

### Restaurante
- Público: `GET /api/restaurantes[?sucursal_id=N]` (incluye `mesas {total, plazas}`), `GET /api/restaurantes/:id` (incluye `menu`) y `GET /api/restaurantes/:id/menu[?categoria=desayuno|entrada|plato_fuerte|postre|bebida]`. Solo muestran productos `disponible=true`.
- Gestión (`admin`, `gerente_restaurante`): `GET /api/restaurantes/:id/productos` (incluye los no disponibles), `POST /api/restaurantes/:id/productos` y `PATCH /api/restaurantes/productos/:productoId`. Sin token responde 401; con otro rol, 403.
- `GET /api/restaurantes/:id/menu?incluir_no_disponibles=true` (público) devuelve la carta completa con `disponible`, para mostrar marcado lo que hoy no se ofrece.
- `GET /api/mesas` incluye `restaurante_id` y `Restaurante {id, nombre}`. Las reservas de mesa no cambian.
- No hay pedidos ni ventas: el menú es informativo.

### Actividades
- `RecursoActividad` incluye `modalidad`, `duracion_minutos`, `cupo_maximo` y `precio_persona`.
- `POST /api/reservas-actividad` acepta `numero_participantes` (1–100, por defecto 1).
  - **experiencia:** `hora_fin` es opcional (la calcula el servidor; si se envía debe coincidir). total = `precio_persona × numero_participantes`. Las reservas con la misma hora de inicio comparten el cupo. Errores: `ACTIVITY_CAPACITY_EXCEEDED` (409); `RESOURCE_OVERLAP` (409) si hay otra salida superpuesta; `INVALID_ACTIVITY_DURATION` (422); `INSTRUCTOR_NOT_APPLICABLE` (422).
  - **por_hora:** igual que antes (30 min–2 h, exclusivo, `precio_hora × horas`). Sin `hora_fin` responde 400 `ACTIVITY_END_TIME_REQUIRED`.
- `precio_hora` de las experiencias (`precio_persona / horas`) ya no se muestra al cliente; se conserva por compatibilidad.
- El carrito cobra `reserva.total`, así que el checkout no cambia (verificado: el ítem del carrito sale con el total por persona × participantes).
- `PATCH /api/recursos-actividad/:id` no permite cambiar la modalidad con reservas confirmadas (409 `ACTIVITY_MODE_IN_USE`).
- `GET /api/recursos-actividad/:id/salidas?fecha=YYYY-MM-DD` (público): salidas confirmadas del día agrupadas por hora de inicio, con `participantes` y `disponibles` (cupo restante en experiencias). Solo conteos, sin datos de clientes.

### Amenidades
- `Amenidad.reservable`. `POST /api/reservas-amenidad` sobre una amenidad compartida responde 422 `AMENITY_NOT_RESERVABLE`.

### Registros conservados fuera del plan
| Registro | Decisión |
|---|---|
| 3 tipos de habitación iniciales sin inventario | Se conservan (no se borra historia) y ya no aparecen en el contrato público |
| Mesa de 8 «Mesa Ejecutiva» (Capital) | Se conserva, vinculada a Cobre & Jade: 33 mesas y 128 plazas, una más que el plan |
| 3 salones anteriores sin equivalente (Las Buganvilias, Gran Salón Metropolitano, Sala Ejecutiva Hunahpú) | Se conservan: tienen foto y tarifa coherentes. Hay 15 salones frente a 12 previstos |
| 4 servicios de spa generales | `activo=false`: fuera del catálogo público, conservados para el historial |
| 8 recursos de actividad por hora (tenis, ciclismo, kayak, billar…) | Se conservan como alquiler por hora |
| «Área de descanso» (Antigua) y «Muelle Privado y Solárium» (Atitlán) | Se conservan como espacios compartidos |

## Etapa 3 — Frontend público integrado

| Módulo | Comportamiento |
|---|---|
| Restaurante (`/restaurante`) | Con una sede elegida: su restaurante, resumen de mesas y carta con categorías seleccionables (Todo, Desayunos, Entradas, Platos fuertes, Postres, Bebidas, con contadores); los productos no disponibles aparecen marcados. Sin sede: los 4 restaurantes con «Ver carta», que fija la sede. Debajo sigue la reserva de mesas sin cambios. Precios con `MoneyReference`, sin sumar impuestos |
| Actividades (`/actividades`) | Filtro visual de modalidad (Todas / Experiencias guiadas / Alquiler por hora). Las experiencias muestran duración real, cupo por salida y precio por persona. En el formulario: fecha, hora de inicio, hora de fin calculada, salidas del día con lugares libres (unirse con un clic), selector «−/+» limitado por el cupo restante y total estimado. Se envía `numero_participantes` sin `hora_fin`. Los recursos por hora conservan su flujo |
| Amenidades (`/amenidades`) | Filtro visual de acceso (Todas / Con reserva / Acceso libre). Las compartidas se muestran sin botón de reserva; un enlace directo (`?recurso=`) a una compartida muestra un aviso en lugar del formulario |

Textos ES/EN propios de cada módulo (`restaurante/menuCopy.ts`, `actividades/experienceCopy.ts`, `amenidades/accessCopy.ts`), para no editar los diccionarios compartidos.

### Pendientes de medios
- Los 60 productos y las 22 experiencias no tienen fotografía: se muestra el estado visual «sin imagen» existente.
- Las 19 amenidades y los 7 salones nuevos tampoco tienen fotografía.

### Limitaciones del backend
- Los recursos de actividad no tienen campo de descripción: la tarjeta muestra la modalidad y el tipo.
- La reserva de mesa no está ligada a la carta: no hay pedidos, ventas ni servicio a la habitación.
- El restaurante no tiene horarios de servicio modelados.

## Etapa 4 — Habitaciones por sede y nombres comerciales

**Causa del problema:** el modelo de precios es global por tipo, así que se crearon 28 tipos (7 por sede) con un nombre interno único (`Deluxe King · Antigua`). El catálogo construía los filtros con las habitaciones de **todas** las sedes y mostraba una tarjeta por cada habitación física.

**Corrección (sin borrar sufijos ni historial):**
- Migración aditiva `20261027050000`: `tipos_habitacion.sucursal_id` (FK) y `nombre_comercial`. El script de carga los rellena desde el plan, no leyendo el sufijo. Los 3 tipos generales anteriores quedan con `NULL`.
- Contrato público:
  - `GET /api/public/tipos-habitacion[?sucursal_id=N]` devuelve solo las categorías con sede e inventario. `nombre` es el comercial; incluye `sucursal_id`, `sucursal` y `habitacion_referencia_id` (una unidad real para enlazar el detalle).
  - `GET /api/public/habitaciones[?sucursal_id=N]` y `/disponibles` exponen `tipo.nombre` comercial y `tipo.sucursal_id`.
- Frontend:
  - `/habitaciones`: una tarjeta por categoría de la sede, ordenadas por tarifa. Los filtros solo muestran las 7 categorías de esa sede; con «Todas las sedes» no hay filtro de categoría.
  - `/reservar`: el selector de tipo solo ofrece las categorías de la sede. Los resultados se agrupan por categoría con «N habitaciones disponibles» según la respuesta del backend.
  - Reservar una categoría selecciona una unidad que el backend devolvió como disponible; si la unidad del enlace ya no está libre, se usa otra disponible de la misma categoría. El servidor revalida al crear.
  - La sede se identifica siempre por ids (`sucursal.id`, `tipo.sucursal_id`), nunca por el texto.
- Bienestar: los 21 servicios pasan a nombres sin sufijo (la sede la da `sucursal_id`) y el catálogo filtra por la sede elegida.

**Pendiente (área de OpenCode):** la tarjeta de confirmación (`ReservaConfirmadaCard`) muestra el número interno asignado (por ejemplo `ANT-019`) después de crear la reserva.
