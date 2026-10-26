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
