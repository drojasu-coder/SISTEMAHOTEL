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
