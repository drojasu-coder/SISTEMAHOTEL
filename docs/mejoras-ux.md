# Mejoras UX — UX-004

## UX-004 · Componentes de la guía visual (fase B)

### Lote 1 (completado)

**Componentes y utilidad creados en `src/components/ui/` y `src/utils/`:**
- `src/utils/formatQ.ts` — formateo de moneda `Q` con 2 decimales (`Intl.NumberFormat('en-US')`), lanza `RangeError` si el monto no es finito.
- `src/components/ui/Spinner.tsx` — indicador de carga accesible: sin `label` es SVG decorativo (`aria-hidden="true"`); con `label` se anuncia como `role="status"` y texto `sr-only`; respeta `prefers-reduced-motion`.
- `src/components/ui/Skeleton.tsx` — esqueleto de carga, `aria-hidden="true"`, `animate-pulse`, respeta `prefers-reduced-motion`.
- `src/components/ui/EmptyState.tsx` — estado vacío con título, descripción y acción opcional; `role="status"`.
- `src/components/ui/ErrorState.tsx` — estado de error con `role="alert"`, botón "Reintentar" y estado de carga.
- `src/components/ui/DataState.tsx` — contenedor por estado (`loading`/`empty`/`error`/`success`) que combina `Skeleton`, `EmptyState` y `ErrorState`.
- `src/components/ui/Badge.tsx` — etiqueta de estado con mapeo `status` (`es.estados`) → tono y punto de color `bg-current`.
- `src/components/ui/Toast.tsx` — `Toast`, `ToastProvider`, `useToast` con notificaciones flotantes (máx. 3, autodescarte 7s, `role="alert"` para errores, `role="status"` para el resto).

**Pruebas (Vitest + Testing Library):**
- `src/utils/formatQ.test.ts`
- `src/components/ui/Spinner.test.tsx`
- `src/components/ui/Skeleton.test.tsx`
- `src/components/ui/EmptyState.test.tsx`
- `src/components/ui/ErrorState.test.tsx`
- `src/components/ui/DataState.test.tsx`
- `src/components/ui/Badge.test.tsx`
- `src/components/ui/Toast.test.tsx`

**Textos agregados en `src/i18n/es.ts`:**
- `es.estados` (disponible, ocupada, mantenimiento, limpieza, confirmada, pendiente, cancelada, pagada, activa, inactiva, en_proceso, expirada, informativo, rechazado, completada, agotado, en_espera).
- `es.comunes.ayuda`.
- `es.componentes` (vacio, vacioDescripcion, toastTitulo, toastDescripcion, toastError, subtotal, descuento, impuestos, total, confirmTitulo, confirmDescripcion, variacion, rol, rolNota, notificaciones).

**Decisiones tomadas:**
- No se instalaron ni actualizaron dependencias (guardarrail respetado): `package.json` y `package-lock.json` sin cambios.
- Se usó `cn()` de `src/lib/cn.ts` y solo clases de Tailwind 3 ya definidas en `tailwind.config.js` (sin `@theme`, `@import 'tailwindcss'` ni `var(--color-*)` sueltas).
- Se reutilizó `Button` existente para `ErrorState` (variante `fantasma` y `isLoading`).
- Se respetaron los contratos de los componentes existentes (no se integró en páginas).
- `Toast` usa el icono `X` de `lucide-react` 0.468 para el botón cerrar.
- Los componentes son compatibles con React 18.3 (`useId` disponible, no se usan APIs exclusivas de React 19).

**Resultados de verificación:**
- `npm --prefix Frontend run typecheck`: ✅ pasa (exit 0).
- `npm --prefix Frontend test` (lote 1): ✅ 29 pruebas pasan en 8 archivos.
- `npm --prefix Frontend run build`: ✅ pasa (vite build OK).

**Descartados (no parte de este lote):** `PermissionGate`, `QRPlaceholder`, `ImageUploader`, `WaitlistModal`, `NotificationBell`, `ConnectionBanner`, `SuggestAlternatives`, `MobileStaffLayout`, `reembolso`.
**No tocados:** `calcularNoches`, `Modal`, `Drawer`, contratos de componentes existentes.

### Lote 2 (completado)

**Componentes creados/adaptados en `src/components/ui/`:**
- `src/components/ui/Card.tsx` — adaptado: conserva el contrato actual (`<div>` con clases `surface`). Agrega subcomponentes opcionales `CardHeader`, `CardContent`, `CardFooter`.
- `src/components/ui/Field.tsx` — nuevo: etiqueta + control + ayuda/error, `id` generado (`crypto.randomUUID()` si no se provee), `aria-describedby`, `aria-invalid`, `role="alert"` en el error.
- `src/components/ui/Select.tsx` — nuevo: `forwardRef`, propaga props al `<select>` nativo para `{...register('campo')}` de RHF.
- `src/components/ui/Textarea.tsx` — nuevo: `forwardRef`, propaga props al `<textarea>` nativo para RHF.
- `src/components/ui/Checkbox.tsx` — nuevo: `forwardRef`, tamaño táctil mínimo, propaga props al input nativo para RHF.
- `src/components/ui/Radio.tsx` — nuevo: `forwardRef`, tamaño táctil mínimo, `name` opcional, propaga props al input nativo para RHF.
- `src/components/ui/Switch.tsx` — nuevo: `forwardRef`, `role="switch"`, `aria-checked`, propaga props al input nativo para RHF.
- `src/components/ui/DateField.tsx` — nuevo: `<input type="date">` vía `Input`, acepta `label` y `hint`, `forwardRef`.
- `src/components/ui/TimeField.tsx` — nuevo: `<input type="time">` vía `Input`, acepta `label` y `hint`, `forwardRef`.
- `src/components/ui/Pagination.tsx` — nuevo: paginación presentacional, página actual con `aria-current="page"`, puntos suspensivos, flechas anterior/siguiente con `aria-label`.
- `src/components/ui/Table.tsx` — nuevo: tabla en desktop, `<dl>` por fila en móvil, `caption` sr-only, soporte de estados con `DataState`.

**Textos agregados en `src/i18n/es.ts`:**
- `es.comunes.pagina`, `es.comunes.de`, `es.comunes.anterior`, `es.comunes.siguiente`.

**Decisiones tomadas:**
- `Button` NO se modificó: conserva variantes `primary/secondary/ghost/danger` y prop `isLoading` (contrato intacto). En `Pagination` se usa `variant="primary"`/`"ghost"`.
- No se consolidaron los helpers `formatearGTQ`/`formatGTQ` existentes (dispersos por features) con `formatQ`: tienen contratos distintos (aceptan `string|null|undefined` y devuelven texto de "no disponible"; `formatQ` lanza `RangeError`). Consolidarlos rompería usos existentes.
- `hint` se agregó a `DateField`/`TimeField` y se pasa a `Input`.
- `id` de `Field` se genera con `crypto.randomUUID()` cuando no se provee (evita depender de `useId` en contexto no-React).
- Todos los controles de formulario usan `forwardRef` y propagan props al elemento nativo para funcionar con `{...register('campo')}` de RHF sin cambios.

**Pruebas (Vitest + Testing Library):**
- `src/components/ui/Card.test.tsx`
- `src/components/ui/Field.test.tsx`
- `src/components/ui/Select.test.tsx` (incluye prueba con `register()` de RHF)
- `src/components/ui/Textarea.test.tsx` (incluye prueba con `register()` de RHF)
- `src/components/ui/Checkbox.test.tsx` (incluye prueba con `register()` de RHF)
- `src/components/ui/Radio.test.tsx` (incluye prueba con `register()` de RHF)
- `src/components/ui/Switch.test.tsx` (incluye prueba con `register()` de RHF)
- `src/components/ui/DateField.test.tsx` (incluye prueba con `register()` de RHF)
- `src/components/ui/TimeField.test.tsx` (incluye prueba con `register()` de RHF)
- `src/components/ui/Pagination.test.tsx`
- `src/components/ui/Table.test.tsx`

**Resultados de verificación (Lote 2):**
- `npm --prefix Frontend run typecheck`: ✅ pasa (exit 0).
- `npm --prefix Frontend test` (suite completa): ✅ 418 pruebas pasan (línea base 381 + 37 nuevas del Lote 2), 1 skipped, 0 fallos.
- `npm --prefix Frontend run build`: ✅ pasa (vite build OK).
- `git diff --stat -- Frontend/package.json Frontend/package-lock.json`: ✅ vacío (sin dependencias agregadas).

**Descartados (no parte de este lote):** `PermissionGate`, `QRPlaceholder`, `ImageUploader`, `WaitlistModal`, `NotificationBell`, `ConnectionBanner`, `SuggestAlternatives`, `MobileStaffLayout`, `reembolso`.
**No tocados:** `calcularNoches`, `Modal`, `Drawer`, contratos de componentes existentes.


## Auditoría e Integración Fotográfica Integral (24 Activos AWS S3)

### 1. Tabla de Auditoría de los 24 Activos de S3

| # | Clave S3 | Asignación en BD | Pantallas Frontend | Estado Actual |
|---|----------|------------------|--------------------|---------------|
| 1 | `sedes/hotel-hunahpu-antigua/portada/portada-1792976550336-c6e0ea0e64f3.webp` | `sucursales.imagen_key` (id: 1) | Gestión de Sedes (`SedesList`), Selector de sedes | En uso activo |
| 2 | `sedes/hotel-hunahpu-atitlan/portada/portada-1792961997929-90ce1baa6953.webp` | `sucursales.imagen_key` (id: 2) | Gestión de Sedes (`SedesList`), Selector de sedes | En uso activo |
| 3 | `sedes/hotel-hunahpu-xela/portada/portada-1792976553574-024b2ef909c7.webp` | `sucursales.imagen_key` (id: 3) | Gestión de Sedes (`SedesList`), Selector de sedes | En uso activo |
| 4 | `sedes/hotel-hunahpu-capital/portada/portada-1792976556088-50343740bac6.webp` | `sucursales.imagen_key` (id: 4) | Gestión de Sedes (`SedesList`), Selector de sedes | En uso activo |
| 5 | `sedes/hotel-hunahpu-antigua/restaurante/restaurante-1792979382402-8965e135bf0c.webp` | `sucursales.restaurante_imagen_key` (id: 1) | Catálogo Gastronómico (`CatalogoRestauranteCliente`), Banner y Mesas | En uso activo |
| 6 | `sedes/hotel-hunahpu-atitlan/restaurante/restaurante-1792979380626-ed36344b711b.webp` | `sucursales.restaurante_imagen_key` (id: 2) | Catálogo Gastronómico (`CatalogoRestauranteCliente`), Banner y Mesas | En uso activo |
| 7 | `sedes/hotel-hunahpu-xela/restaurante/restaurante-1792979384445-ec4e9ccb7221.webp` | `sucursales.restaurante_imagen_key` (id: 3) | Catálogo Gastronómico (`CatalogoRestauranteCliente`), Banner y Mesas | En uso activo |
| 8 | `sedes/hotel-hunahpu-capital/restaurante/restaurante-1792979386020-7a136c58e912.webp` | `sucursales.restaurante_imagen_key` (id: 4) | Catálogo Gastronómico (`CatalogoRestauranteCliente`), Banner y Mesas | En uso activo |
| 9 | `sedes/hotel-hunahpu-antigua/amenidades/area-descanso-1792979382890-7c927720f18a.webp` | `amenidades.imagen_key` (id: 1) | Catálogo de Amenidades (`CatalogoAmenidadesCliente`) | En uso activo |
| 10 | `sedes/hotel-hunahpu-atitlan/amenidades/piscina-terraza-1792979381008-038e78a52f05.webp` | `amenidades.imagen_key` (id: 2) | Catálogo de Amenidades (`CatalogoAmenidadesCliente`) | En uso activo |
| 11 | `sedes/hotel-hunahpu-xela/amenidades/gimnasio-sauna-1792979384813-e01a1568baf4.webp` | `amenidades.imagen_key` (id: 3) | Catálogo de Amenidades (`CatalogoAmenidadesCliente`) | En uso activo |
| 12 | `sedes/hotel-hunahpu-capital/amenidades/salon-ejecutivo-1792979386396-151d6e1b7244.webp` | `amenidades.imagen_key` (id: 4) | Catálogo de Amenidades (`CatalogoAmenidadesCliente`) | En uso activo |
| 13 | `sedes/hotel-hunahpu-antigua/habitaciones/individual-1792979381507-3a2dc3c5b8fc.webp` | `habitaciones.imagen_key` (id: 1, hab 101) | Reserva de Habitaciones (`HabitacionesDisponiblesList`) | En uso activo |
| 14 | `sedes/hotel-hunahpu-antigua/habitaciones/doble-1792979381786-9cd99362721f.webp` | `habitaciones.imagen_key` (id: 2, hab 102) | Reserva de Habitaciones (`HabitacionesDisponiblesList`) | En uso activo |
| 15 | `sedes/hotel-hunahpu-antigua/habitaciones/suite-1792979382090-513f3df1acd7.webp` | `habitaciones.imagen_key` (id: 3, hab 103) | Reserva de Habitaciones (`HabitacionesDisponiblesList`) | En uso activo |
| 16 | `sedes/hotel-hunahpu-atitlan/habitaciones/individual-1792979378527-420f162f2ab7.webp` | `tipos_habitacion.imagen_key` (id: 1) / `habitaciones.imagen_key` (id: 4, hab 201) | Catálogo de Tipos (`TiposHabitacionList`), Disponibles (`HabitacionesDisponiblesList`) | En uso activo |
| 17 | `sedes/hotel-hunahpu-atitlan/habitaciones/doble-1792979379614-1f76606e8cc7.webp` | `tipos_habitacion.imagen_key` (id: 2) / `habitaciones.imagen_key` (id: 5, hab 202) | Catálogo de Tipos (`TiposHabitacionList`), Disponibles (`HabitacionesDisponiblesList`) | En uso activo |
| 18 | `sedes/hotel-hunahpu-atitlan/habitaciones/suite-1792979380176-40a2118460a9.webp` | `tipos_habitacion.imagen_key` (id: 3) / `habitaciones.imagen_key` (id: 6, hab 203) | Catálogo de Tipos (`TiposHabitacionList`), Disponibles (`HabitacionesDisponiblesList`) | En uso activo |
| 19 | `sedes/hotel-hunahpu-xela/habitaciones/individual-1792979383570-c0c20efce3e7.webp` | `habitaciones.imagen_key` (id: 7, hab 301) | Reserva de Habitaciones (`HabitacionesDisponiblesList`) | En uso activo |
| 20 | `sedes/hotel-hunahpu-xela/habitaciones/doble-1792979383865-a403d4595839.webp` | `habitaciones.imagen_key` (id: 8, hab 302) | Reserva de Habitaciones (`HabitacionesDisponiblesList`) | En uso activo |
| 21 | `sedes/hotel-hunahpu-xela/habitaciones/suite-1792979384157-60ca7a5535f4.webp` | `habitaciones.imagen_key` (id: 9, hab 303) | Reserva de Habitaciones (`HabitacionesDisponiblesList`) | En uso activo |
| 22 | `sedes/hotel-hunahpu-capital/habitaciones/individual-1792979385123-9363904f8dd0.webp` | `habitaciones.imagen_key` (id: 10, hab 401) | Reserva de Habitaciones (`HabitacionesDisponiblesList`) | En uso activo |
| 23 | `sedes/hotel-hunahpu-capital/habitaciones/doble-1792979385446-cd158329ef17.webp` | `habitaciones.imagen_key` (id: 11, hab 402) | Reserva de Habitaciones (`HabitacionesDisponiblesList`) | En uso activo |
| 24 | `sedes/hotel-hunahpu-capital/habitaciones/suite-1792979385758-59871b8cbe76.webp` | `habitaciones.imagen_key` (id: 12, hab 403) | Reserva de Habitaciones (`HabitacionesDisponiblesList`) | En uso activo |

### 2. Correcciones Implementadas

1. **Activación de las habitaciones sin uso en PostgreSQL (`hotel_db`):**
   - Se crearon las habitaciones para las 3 sedes faltantes (Atitlán: 201, 202, 203; Xela: 301, 302, 303; Capital: 401, 402, 403), asociándoles directamente sus `imagen_key` de S3.
   - `tipos_habitacion` mantiene las fotos de Atitlán como imagen genérica de respaldo (`fallback`) cuando una habitación no disponga de fotografía individual.
2. **Unificación y Dinamismo de Créditos con Enlace:**
   - Se adaptó `backend/src/services/storage/credits.ts` para proveer `AssetCreditInfo` (`autor`, `licencia`, `url`, `texto`) para cada una de las 24 claves oficiales.
   - Se actualizaron todos los componentes frontend (`SedesList`, `CatalogoAmenidadesCliente`, `CatalogoRestauranteCliente`, `TiposHabitacionList`, `HabitacionesDisponiblesList`) para renderizar hipervínculos clickeables a las fuentes oficiales de Wikimedia Commons con `target="_blank"` y `rel="noopener noreferrer"`.
3. **Verificación de Crédito Portada Atitlán:**
   - Portada oficial `01_portada_sede_atitlan`: autor verificado **Chad Davis**, licencia **CC BY 2.0** (`https://commons.wikimedia.org/wiki/File:Lake_Atitl%C3%A1n_%26_Panajachel_Guatemala.jpg`), coherente con `METADATOS.json` y `README.md`.
4. **Unicidad de Archivos:**
   - El cómputo de hashes SHA-256 sobre los 24 archivos WebP confirmó 24 hashes únicos (0 duplicados a nivel binario).

### 3. Fotografías Dudosas Dejadas a Decisión del Usuario

De conformidad con las restricciones, no se sustituyó ninguna imagen de forma autónoma. Se listan las siguientes observaciones para decisión del usuario:
1. **Habitaciones de Xela (Misma habitación):** Las fotografías de individual, doble y suite de Xela corresponden a tres tomas o ángulos distintos del *mismo cuarto* ("Zimmer 323" de Hotel Kasererbräu en Salzburgo, Austria por Thomas Ledl).
2. **Reutilización del Resort Amantaka (Laos):** La suite, restaurante y piscina de Atitlán, junto con la doble y suite de Antigua y el restaurante de Xela, fueron tomadas todas en el resort de lujo Amantaka en Luang Prabang, Laos (Basile Morin).
3. **Ubicaciones foráneas:** Diversas imágenes de habitaciones guatemaltecas provienen de hoteles de Osaka (Japón), Kobe (Japón), Lévis (Quebec) y Millbrae (San Francisco Airport, CA).

### 4. Resultados de Verificación Final
- **AWS S3:** 24/24 URLs prefirmadas validadas con respuesta HTTP 200 OK.
- **Backend:** 14/14 suites unitarias (89 pruebas) + 2/2 suites de integración con base PostgreSQL aislada (17 pruebas) aprobadas al 100%. Typecheck sin errores.
- **Frontend:** 71 suites (441 pruebas) aprobadas al 100%, 0 fallos. Typecheck y compilación de producción con Vite exitosas.
- **Dependencias:** 0 modificaciones en `package.json` y `package-lock.json` en ambos proyectos.
