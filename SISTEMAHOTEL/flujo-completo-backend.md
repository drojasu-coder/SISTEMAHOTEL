# Flujo Completo del Proyecto — SISTEMAHOTEL (Backend)

Este documento es el mapa completo de todo lo que falta construir, en orden,
con qué tecnología se usa en cada parte y por qué va en ese orden. Úsalo para
saber siempre "dónde vamos" sin depender de memoria.

---

## YA COMPLETADO

### Fase 1 — Diseño y Documentación
- DERCAS con 25 requerimientos (hecho por el equipo).
- Diseño de base de datos: 31 tablas modeladas en DBML (dbdiagram.io).
- Arquitectura definida: monolito modular (no microservicios), React + Express + PostgreSQL.

### Fase 2 — Configuración del entorno
- Repositorio GitHub (monorepo): drojasu-coder/SISTEMAHOTEL.
- Docker Compose con PostgreSQL 16 + pgAdmin, corriendo igual en Windows y Fedora.
- Backend inicializado: Node.js + Express + TypeScript.
- Entorno replicado exitosamente en dos sistemas operativos distintos (prueba de que
  la configuración es reproducible en equipo).

---

## FASE 3 — BACKEND (donde estamos ahora)

Reorganizada internamente en 7 sub-fases (A a G), siguiendo arquitectura por capas:

```
Route → Controller → Service → Model
```

- **Route**: conecta una URL con una función del Controller. Sin lógica.
- **Controller**: traductor HTTP — recibe la petición, llama al Service, arma la
  respuesta con el código de estado correcto. Nunca decide reglas de negocio.
- **Service**: la lógica de negocio real (validaciones, cálculos, reglas). Es el
  único que habla directamente con los Models.
- **Model**: define la tabla en Sequelize (ya lo estamos construyendo).

Ventaja de esta separación: si el día de mañana cambia la forma de entrada (de
API REST a otra cosa), el Service se reutiliza intacto — solo cambiaría el Controller.

Todo el código de esta fase vive dentro de `backend/src/`, organizado en:
`config/ migrations/ models/ seeders/ controllers/ services/ routes/ middlewares/ types/`
con `.sequelizerc` en la raíz de `backend/` apuntando a esas rutas dentro de `src/`.

---

### Fase A — Terminar los 31 modelos [EN PROGRESO: 22/31]

Herramienta: `sequelize-cli` (model:generate + migrations).

Por cada tabla del diagrama DBML: generar modelo → corregir `references` y
`tableName` (Sequelize no adivina bien nombres en español) → definir relaciones
(`belongsTo` / `hasMany` / `hasOne`, según si "puede haber muchos compartiendo el
mismo valor") → migrar → verificar con `\d nombre_tabla` en psql.

Orden por oleadas (una tabla no se crea hasta que las que referencia ya existen):
- Oleada 0 (sin dependencias): usuarios, sucursales, tipos_habitacion, servicios_evento,
  instructores, terapeutas, servicios_bienestar, choferes, vehiculos, promociones,
  proveedores — **completa**.
- Oleada 1 (dependen de Oleada 0): habitaciones, parqueos, salones, mesas,
  recursos_actividad, amenidades, empleados, proveedor_productos, cuentas_por_pagar,
  carritos, facturas, boletos_parque — **en progreso**.
- Oleada 2 (dependen de Oleada 1): reservas_habitacion, reservas_evento, reservas_mesa,
  reservas_actividad, reservas_amenidad, citas_bienestar, reservas_transporte, turnos,
  carrito_items, factura_items — pendiente.
- Oleada 3 (dependen de Oleada 2): reservas_parqueo, pagos, reserva_evento_servicios — pendiente.

---

### Fase B — Seed script (datos de prueba compartidos)

Herramienta: `sequelize-cli` (seeders), carpeta `src/seeders/`.

Un archivo que inserta datos de ejemplo (2-3 sucursales, tipos de habitación,
un usuario admin) para que los 3 integrantes del equipo tengan exactamente los
mismos datos de prueba en sus bases de datos locales, sin tener que crearlos a
mano cada quien. Se sube al repo y cada quien lo corre una vez.

---

### Fase C — Infraestructura de errores, validación y autenticación

Se construye ANTES de los módulos (no después) para que todos los módulos la
usen desde el día uno, en vez de tener que volver a tocar 15+ archivos después
para agregarla.

**Piezas a construir:**

1. **`AppError`** (clase de error personalizada, en `src/utils/`): permite lanzar
   errores con su código HTTP correcto desde cualquier Service
   (`throw new AppError(404, "Habitación no encontrada")`).

2. **`errorMiddleware`** (en `src/middlewares/`): un solo punto central que atrapa
   todos los errores de la aplicación, devuelve el código y mensaje correctos al
   cliente, y nunca expone detalles internos (mensajes crudos de PostgreSQL, stack
   traces) — solo los registra en el log del servidor.

3. **Librería de validación** (`express-validator` o `zod`): revisa que los datos
   que llegan en cada petición tengan el tipo y formato correcto ANTES de que
   lleguen al Service (evita que un texto en un campo numérico cause un error 500).

4. **`authMiddleware` + `requireRole`** (JWT adaptado a Sequelize): verifican que
   las rutas protegidas tengan un token válido (401 si no) y el rol correcto
   (403 si no tiene permiso).

**Códigos HTTP que se usan en todo el proyecto a partir de aquí:**

| Código | Significado | Ejemplo en el proyecto |
|---|---|---|
| 200 OK | Éxito, devuelve datos | Listar habitaciones |
| 201 Created | Se creó algo nuevo | Crear una reserva |
| 204 No Content | Éxito, sin contenido que devolver | Eliminar una reserva |
| 400 Bad Request | Datos mal formados o tipo incorrecto | Texto en un campo numérico |
| 401 Unauthorized | Falta token o es inválido | Reservar sin haber iniciado sesión |
| 403 Forbidden | Identificado, pero sin permiso | Recepcionista accediendo a reportes de admin |
| 404 Not Found | El recurso pedido no existe | Buscar una habitación con id inexistente |
| 409 Conflict | Choca con el estado actual de los datos | Reservar una habitación ya ocupada esas fechas |
| 422 Unprocessable Entity | Tipo correcto, pero viola una regla de negocio | Fecha de salida antes que la de entrada |
| 500 Internal Server Error | Fallo interno inesperado (nunca culpa del cliente) | La base de datos no responde |

Regla de oro: un error del usuario (dato mal mandado) nunca debería devolver 500 —
eso es 400/422, controlado y con mensaje claro. El 500 se reserva para fallos
genuinamente inesperados.

---

### Fase D — Construcción módulo por módulo [el bloque más largo]

Por cada uno de los ~15-18 recursos del sistema, en este orden exacto:

1. **Service** — lógica de negocio, usa los Models, lanza `AppError` con el código
   correcto cuando algo no cumple una regla.
2. **Controller** — recibe la petición, llama al Service dentro de un `try/catch`,
   pasa los errores a `next(error)` para que los atrape el `errorMiddleware`.
3. **Route** — conecta la URL con el Controller, aplica `authMiddleware`/`requireRole`
   donde corresponda.
4. **Documentar con Swagger** — comentarios especiales arriba de cada ruta, a medida
   que se construye (no se deja acumulado para el final).
5. **Probar con Thunder Client** — incluyendo casos de error a propósito (tipo de
   dato incorrecto, ID inexistente, sin token) — es ensayar lo que el catedrático
   va a probar en la presentación.

**Orden sugerido de módulos:**
`usuarios` (login/JWT) → `sucursales` → `habitaciones` → `reservas_habitacion`
(aquí entra la validación de traslape de fechas, código 409) → `parqueos` → resto
de módulos de reserva (eventos, restaurante, actividades, amenidades, bienestar,
parque temático, transporte) → `carrito` → `pagos` → `facturación` →
`personal`/`proveedores` (más simples, CRUD básico).

---

### Fase E — Integraciones externas

- **Stripe**: el catedrático exige una interfaz de pago propia, construida por el
  equipo — NO usar Stripe Checkout (la página prediseñada de Stripe). Se usa la
  **Payment Intents API + Stripe Elements/Stripe.js**: Stripe solo captura el número
  de tarjeta de forma segura (para cumplir PCI-DSS), pero el diseño del formulario
  de pago es 100% del equipo. La comisión de Stripe (~2.9% + $0.30 por transacción)
  se cobra igual sin importar qué interfaz se use — no se puede evitar, es el costo
  del servicio, no de la interfaz elegida.
- **AWS S3**: subida y almacenamiento de fotos de habitaciones.
- **Socket.io**: actualización en tiempo real del estado de los parqueos (de la
  Fase 3 del plan técnico original).

---

### Fase F — Reportes y métricas (Requerimientos 21 y 22 del DERCAS)

No necesitan tabla propia en la base de datos: se calculan con consultas
(`GROUP BY`, `SUM`, `COUNT`, joins) sobre las tablas que ya existen
(`reservas_habitacion`, `facturas`, `pagos`, etc.), recalculándose cada vez que se
piden. Van en un `ReportesService` centralizado, con una función por reporte,
mismo patrón de capas (Service → Controller → Route), pero solo lectura.

---

### Fase G — Documento escrito final para la universidad

Diccionario de datos completo, diagrama final, manual técnico. Se arma casi al
final, cuando ya se pueden capturar pantallas reales del sistema funcionando
(Thunder Client, pgAdmin, el diagrama de dbdiagram.io).

---

## MAPA VISUAL RESUMIDO

```
[Fase 1: Diseño]           ✅ completo
[Fase 2: Config entorno]   ✅ completo
[Fase 3A: Modelos]         🔵 en progreso (22/31)
[Fase 3B: Seed script]     ⬜ pendiente
[Fase 3C: Errores/Auth]    ⬜ pendiente
[Fase 3D: Módulos]         ⬜ pendiente (el bloque más largo, ~15-18 módulos)
[Fase 3E: Integraciones]   ⬜ pendiente (Stripe propio, S3, Socket.io)
[Fase 3F: Reportes]        ⬜ pendiente
[Fase 3G: Doc. final]      ⬜ pendiente
[Fase 4: Frontend]         ⬜ pendiente (no detallado en este documento)
[Fase 5: Despliegue]       ⬜ pendiente (Docker producción, AWS EC2, Nginx)
```
