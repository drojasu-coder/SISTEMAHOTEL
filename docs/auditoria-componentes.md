# Auditoria de componentes — UX-004

> Fuente de referencia (SOLO LECTURA): `/MATERIAL-HOTEL/guia-componentes/`.
> No se modificó ni se copió ningún archivo de esa carpeta. Puede estar hecha para versiones más nuevas que las del proyecto.

## 1. Origen y alcance

- Objetivo: comparar la guía de componentes de Hotel Hunahpú frente al estado actual del frontend (`Frontend/`).
- Trabajo previo: lectura completa de la guía (componentes UI, layouts, utilidades, i18n, `globals.css` con tokens), lectura de `Frontend/package.json`, `tailwind.config.js`, `postcss.config.js`, `vite.config.ts`, `tsconfig.json`, `src/components/`, `src/assets/`, `src/i18n/es.ts` y `src/test/setup.ts`.
- Fase A = auditoría únicamente. Sin tocar código de producción. Se detiene aquí a la espera de confirmación de qué componentes adaptar (Fase B).

---

## 2. Stack de referencia (guía) vs. stack actual (frontend)

| Capa | Guía de referencia (solo lectura) | Frontend actual (SISTEMAHOTEL) | Compatibilidad |
|------|-----------------------------------|--------------------------------|----------------|
| React | `19.2.4` | `^18.3.1` | ⚠️ versión distinta (ver §6) |
| Bundler | Vite `^8.3.4` | Vite `^6.0.3` | OK (config similar) |
| CSS | Tailwind `^4.3.3` + `@tailwindcss/postcss` (`@theme static`) | Tailwind `^3.4.17` + postcss/autoprefixer | ❌ INCOMPATIBLE (ver §6.1) |
| Enrutador | No usa React Router (app autónoma) | React Router DOM `^6.28.0` | N/A |
| Formularios | Estado manual (WaitlistModal) | React Hook Form `^7.54.1` + Zod `^3.24.1` | N/A |
| Iconos | `lucide-react ^1.16.0` | `lucide-react ^0.468.0` | ⚠️ mismo set de iconos; nombres válidos en 0.468 |
| Utilidades CSS | `clsx ^2.1.1` + `tailwind-merge ^3.3.1` (`cn` con `twMerge`) | `src/lib/cn.ts` propio (sin dependencias, no fusiona clases) | ⚠️ `twMerge` no disponible (ver §6.2) |
| Testing | — | Vitest `^2.1.8` + `@testing-library/react ^16.1.0` + jest-dom | OK |
| i18n | `src/i18n/es.ts` (es) | `src/i18n/es.ts` (es) | OK (claves distintas; se agregan las que falten) |

**Reglas respetadas en esta auditoría:**
- No se actualizan ni agregan dependencias sin aprobación. Si un componente las requiere, se propone alternativa con lo existente y se avisa.
- Se respetan los contratos (props y uso) de los componentes que ya existen.
- No se cambia lógica de negocio, rutas ni llamadas a la API.

---

## 3. Tokens de diseño definidos en la guía

Extraídos de `app/globals.css` (`@theme static`) y `Foundations.tsx`.

### Colores
| Token | Escala | Uso declarado en la guía |
|-------|--------|--------------------------|
| `bronce` | 50–900 | Acciones y acentos (primario) |
| `selva` | 50–900 | Acciones secundarias |
| `neutro` | 50–900 | Fondos y contenido |
| `exito` | 50, 600, 700 | Estados positivos |
| `error` | 50, 600, 700 | Estados de error |
| `advertencia` | 50, 600, 700 | Advertencias |
| `info` | 50, 600, 700 | Informativos |

Semánticos: `--color-background` (=neutro-50), `--color-foreground` (=neutro-900), `--color-card` (#FFFFFF), `--color-border` (=neutro-300), `--color-primary` (=bronce-600), `--color-ring` (=bronce-600), `--color-muted` (=neutro-100), `--color-muted-foreground` (=neutro-600).

### Tipografía
- Fuentes (Google Fonts, ya presentes en `index.html` del proyecto): **Cormorant Garamond** (serif, titulares) y **Montserrat** (sans, cuerpo/interfaz).
- Tamaños: `display` 72px; `h1` 56px / móvil 40px; `h2` 40px / móvil 32px; `h3` 30px / móvil 26px; `price` 32px; `base` 16px; `sm` 14px; `xs` 12px (cada uno con su línea de altura).
- Pesos: títulos `font-serif font-semibold`; cuerpo `font-sans`.

### Radios
`sm` 4px · `md` 8px · `lg` 12px · `xl` 16px · `2xl` 24px.

### Sombras
- `shadow-soft`: `0 4px 24px rgba(43,38,34,0.04)` (aplicado a `.surface`, `dialog`, tarjetas, toasts).

### Espaciados / demás
- `sidebar`: 248px; `min-h-11`: 2.75rem; `min-h-13`: 3.25rem.
- `:focus-visible`: outline-2 outline-offset-4 outline-bronce-600.
- `dialog::backdrop`: bg-neutro-900/40 backdrop-blur-sm.
- `prefers-reduced-motion`: desactiva animaciones y transiciones.

### Estado de los tokens en el proyecto actual
`tailwind.config.js` ya adapta estos tokens a Tailwind 3 (`colors.bronce/selva/neutro/exito/error/advertencia/info`, `fontFamily.sans/serif`, `borderRadius`, `boxShadow.soft`, `spacing.sidebar`, `minHeight[11,13]`). **No es necesario crear tokens nuevos.**

---

## 4. Componentes, patrones y utilidades que define la guía

### A. Fundamentos
- `Foundations`: paleta de colores, tipografía, estados (Badge con mapeo `statusTone` de `es.estados` → tono).

### B. Componentes UI (`components/ui/`)
| Componente | Descripción |
|------------|-------------|
| `Icon` | Envoltorio de lucide por nombre (`IconName`), tamaños sm/md/lg, `cargando` con `animate-spin`. |
| `Button` | Variantes `primario`/`secundario`/`fantasma`/`peligro`; tamaños sm/md/lg; `loading`; `state` (normal/hover/foco/error); `aria-busy`. |
| `Field` | Etiqueta + control + ayuda/error asociado (`aria-describedby`, `role="alert"`). |
| `Input` / `DateField` / `TimeField` / `Select` / `Textarea` | `field-control`, `useId()`, estados de error/loading/disabled. |
| `Checkbox` / `Radio` / `Switch` | `Choice` interno; switch con `role="switch"`. |
| `Badge` | `status` (mapeado desde `es.estados`) o `tone` libre; punto de color `bg-current`. |
| `Card` / `CardHeader` / `CardContent` / `CardFooter` | `.surface` (borde suave, fondo blanco, sombra). |
| `PriceSummary` | Desglose subtotal/descuento/impuestos/total con `formatQ` y `tabular-nums`. |
| `StatusTimeline` | Lista de pasos con ícono check/reloj y conector vertical. |
| `Table` | Tabla responsiva (desktop `table`, móvil `dl` por fila), `caption` sr-only, `DataState`. |
| `Pagination` | Paginación con puntos suspensivos, aria-current, flechas anterior/siguiente. |
| `ExportMenu` | `<details>` menú PDF/Excel/CSV con `useToast`. |
| `Spinner` / `Skeleton` | Carga e indicadores de esqueleto. |
| `EmptyState` / `ErrorState` | Estados vacíos y de error con acción de reintento. |
| `DataState` | Contenedor por estado: `loading`/`empty`/`error`/`success`. |
| `Toast` / `ToastProvider` / `useToast` | Notificaciones flotantes (máx. 3, autodescarto 7s), tono success/error/info/warning. |
| `Tabs` | Tablist accesible (aria-selected/controls, navegación con flechas/Home/End). |
| `Stepper` | Pasos numerados con estados completado/actual/error. |
| `Modal` / `Drawer` / `ConfirmDialog` / `WaitlistModal` | Superposición (`dialog` en guía), foco, cierre Escape/clic fuera, confirmación de peligro, lista de espera con validación manual. |
| `AvailabilityCalendar` | Calendario de disponibilidad (single/range), precios, soldout, leyenda, aria-live. |
| `Countdown` | Temporizador de retención (15 min), aviso <2 min, expiración. |
| `ConnectionBanner` | online/offline/syncing/synced con contador de pendientes. |
| `QRPlaceholder` | Marcador de código QR (pendiente de backend). |
| `NotificationBell` | Campana con contador de no leídos y panel desplegable. |
| `SuggestAlternatives` | Tarjetas de alternativas con `DataState`. |
| `PermissionGate` | Presentación de permisos (rol/módulo/acción) usando `mocks/permisos`. |
| `ImageUploader` | Subida de imagen JPG/PNG/WebP ≤5 MB, previsualización local, `uploadTodo` (S3 pendiente). |

### C. Layouts (`components/layouts/`)
- `PublicLayout`: header con navegación pública, selector de sede, carrito con cuenta atrás, cajón móvil, footer.
- `AdminLayout`: aside navegable por grupos y permisos, header con campana y perfil, cajón móvil.
- `MobileStaffLayout`: barra inferior fija (staff/chofer), header compacto.
- `shared.tsx`: `Brand` (imagen con fallback textual), `SedeSelector`, `ServiceAvailability`.

### D. Utilidades (`utils/` y `i18n/`)
- `formatQ`: moneda `Q` con `Intl.NumberFormat('en-US')`, 2 decimales, lanza `RangeError` si no es finito.
- `fechas`: `parseDate`, `fechaCorta`, `fechaLarga`, `calcularNoches`, `rangoNoches`, `dateKey` (zona `America/Guatemala`).
- `reembolso`: `calcularReembolsoEvento(diasRestantes, montoPagado)` con tramos de porcentaje.
- `i18n/es.ts`: `marca`, `comunes`, `navegacion`, `errores`, `estados`, `politicas`, `formularios`, `componentes`, `roles`, `guia`.

### E. Patrones de accesibilidad y diseño
- Móvil primero, foco visible (`outline-bronce-600`), `aria-*`, `role="dialog/alert/status/timer/tab/tabpanel/switch"`, `prefers-reduced-motion`, `accent-color` bronce en checkboxes/radios, `tabular-nums` en precios.

---

## 5. Tabla de equivalencia: guía → actual

Estado: `ya existe` | `adaptar` | `nuevo` | `descartar`.

| Componente de la guía | Equivalente actual | Estado | Conflictos de versión | Esfuerzo |
|-----------------------|--------------------|--------|-----------------------|----------|
| `Icon` (lucide por nombre) | No existe como componente; se importa lucide directamente | **nuevo** | lucide 1.16 (guía) vs 0.468 (proyecto); iconos `cargando`, `alerta`, etc. existen en 0.468 | bajo |
| `Button` | `src/components/ui/Button.tsx` | **adaptar** | variantes guía `primario/secundario/fantasma/peligro` vs actuales `primary/secondary/ghost/danger`; guía agrega `state` y texto de carga; lucide 0.468 | medio |
| `Field` | No existe | **nuevo** | — | bajo |
| `Input` | `src/components/ui/Input.tsx` (forwardRef) | **adaptar** | guía agrega `DateField`/`TimeField`/`Select`/`Textarea`/`Checkbox`/`Radio`/`Switch` y `state`; `useId()` disponible en React 18 | medio |
| `DateField` / `TimeField` / `Select` / `Textarea` / `Checkbox` / `Radio` / `Switch` | No existen | **nuevo** | React Hook Form + Zod 3 en formularios de página (no acoplar) | bajo/medio |
| `Badge` | No existe | **nuevo** | mapeo `es.estados` → tono (claves de i18n a agregar) | bajo |
| `Card` | `src/components/ui/Card.tsx` | **adaptar** | actual es `<div surface p-4 sm:p-6>`; guía agrega `CardHeader`/`CardContent`/`CardFooter` y usa `article` | bajo |
| `PriceSummary` | No existe | **nuevo** | `formatQ` no existe en frontend (por crear en `src/utils/`) | medio |
| `StatusTimeline` | No existe | **nuevo** | — | medio |
| `Table` | No existe | **nuevo** | — | medio |
| `Pagination` | No existe | **nuevo** | — | bajo |
| `ExportMenu` | No existe | **nuevo** | depende de `useToast` (por crear) | medio |
| `Spinner` | `Button.Spinner` (SVG embebido) | **adaptar** | reexportar como componente independiente | bajo |
| `Skeleton` | No existe | **nuevo** | `prefers-reduced-motion` (no hay utilidad central aún) | bajo |
| `EmptyState` | No existe | **nuevo** | — | bajo |
| `ErrorState` | No existe | **nuevo** | — | bajo |
| `DataState` | No existe | **nuevo** | — | bajo |
| `Toast` / `ToastProvider` / `useToast` | No existe | **nuevo** | — | medio |
| `Tabs` | No existe | **nuevo** | navegación por teclado (flechas/Home/End) | medio |
| `Stepper` | No existe | **nuevo** | — | bajo |
| `Modal` | `src/components/ui/Modal.tsx` | **adaptar** | guía usa `<dialog>`+`showModal()`; actual usa `div` con foco atrapado (mantener contrato actual) | bajo |
| `Drawer` | `src/components/ui/Drawer.tsx` | **adaptar** | igual que Modal; actual es solo móvil (`lg:hidden`) | bajo |
| `ConfirmDialog` | No existe | **nuevo** | — | bajo |
| `WaitlistModal` | No existe | **nuevo** | validación manual (no React Hook Form) | medio |
| `AvailabilityCalendar` | No existe | **nuevo** | `utils/fechas` (`dateKey`, `fechaCorta`) por crear | medio |
| `Countdown` | No existe | **nuevo** | — | bajo |
| `ConnectionBanner` | No existe | **nuevo** | — | bajo |
| `QRPlaceholder` | No existe | **nuevo** | — | bajo |
| `NotificationBell` | No existe | **nuevo** | — | medio |
| `SuggestAlternatives` | No existe | **nuevo** | — | medio |
| `PermissionGate` | No existe | **nuevo** | `mocks/permisos` es solo presentación (sin backend) | bajo |
| `ImageUploader` | No existe (existe `src/features/sedes/components/SedeImageUploader.tsx` sin hacer seguimiento / untracked, distinto) | **nuevo** | `uploadTodo` = URL prefirmada S3 pendiente; no se toca lógica de API | medio |
| `PublicLayout` | `Navbar.tsx` + `Footer.tsx` + `AuthPageLayout.tsx` (parciales) | **adaptar** | layout completo nuevo; no cambiar rutas | medio |
| `AdminLayout` | No existe como layout | **nuevo** | aside por permisos; no tocar rutas | medio |
| `MobileStaffLayout` | No existe | **nuevo** | — | medio |
| `Brand` | `src/components/shared/Brand.tsx` | **adaptar** | actual usa `useBranding` (S3) + variantes full/compact/inverse; guía es simplificada con `src` prop | bajo |
| `formatQ` | No existe en `src/` | **nuevo** | utilidad pura (sin dependencias) | bajo |
| `fechas` (`parseDate`, `fechaCorta`, `fechaLarga`, `calcularNoches`, `rangoNoches`, `dateKey`) | `calcularNoches` ya existe en `src/features/mis-reservas/formato.ts` (usado por varias páginas) | **adaptar / reutilizar** | ⚠️ comportamiento distinto: la devuelve `null` para fechas inválidas/invertidas; la guía usa `Math.max(0, ...)` (devuelve 0). No se debe romper el existente; crear utilidad compartida en `src/utils/` si se acuerda. | medio |
| `reembolso` (`calcularReembolsoEvento`) | No existe | **nuevo** | utilidad pura de cálculo (financiera, verificar contra backend) | medio |

**Resumen de estados:** 10 ya existen (total o parcialmente), ~27 nuevos, ~8 a adaptar, 0 descartar.

---

## 6. Sintaxis incompatible con nuestras versiones y cómo adaptarla

### 6.1 Tailwind v4 (`@theme static`, `@import 'tailwindcss'`, `@layer`) vs Tailwind 3.4
La guía usa Tailwind 4 con variables CSS nativas (`--color-bronce-600`) y `@theme static`. Tailwind 3.4 no entiende `@import 'tailwindcss'` ni `@theme static`.
- **Adaptación:** No se actualiza Tailwind. Los tokens ya están mapeados en `tailwind.config.js` como clases (`bg-bronce-600`, `rounded-md`, `shadow-soft`, etc.). Se escriben componentes usando clases Tailwind 3, no variables CSS `--color-*`. El `index.html` del proyecto ya importa las mismas fuentes (Cormorant Garamond + Montserrat).

### 6.2 `clsx` + `tailwind-merge` (`twMerge`) no disponibles
La guía depende de `clsx` y `tailwind-merge` para fusionar clases (evitar duplicados conflictivos). El proyecto tiene `src/lib/cn.ts` propio, sin dependencias, que solo une valores truthy (no hace `twMerge`).
- **Adaptación:** No se agregan dependencias sin aprobación. Al escribir clases, ordenarlas intencionalmente (clases de intención/variante después de las base) y evitar clases que se anulen entre sí. `cn()` de `src/lib/cn.ts` es suficiente.

### 6.3 `lucide-react ^1.16.0` vs `^0.468.0`
La guía importa iconos por nombre desde `lucide-react`. El proyecto usa `0.468.0`, que incluye todos los iconos usados en la guía (`Search`, `ChevronRight`, `Loader2`/`cargando`, `TriangleAlert`/`alerta`, `CircleCheck`/`exito`, `CircleX`/`error`, `QrCode`, `CreditCard`, etc.).
- **Adaptación:** Usar los nombres de lucide-react 0.468 existentes; no instalar una versión mayor.

### 6.4 React 19 vs React 18.3
La guía declara React 19.2.4, pero no usa APIs exclusivas de React 19 (no se detectaron `useActionState`, `useOptimistic`, etc.). `createRoot` y `StrictMode` son de React 18 y funcionan igual.
- **Adaptación:** Escribir componentes compatibles con React 18.3 (no usar `useEffect` callbacks sin limpieza problemática, evitar patrones solo de 19). `useId()` sí está disponible en React 18.

### 6.5 `<dialog>` + `showModal()` en `Modal`/`Drawer` de la guía
La guía implementa overlays con `<dialog>` y `dialog.showModal()`. El proyecto ya tiene `Modal` y `Drawer` implementados con `div` + manejo de foco, Escape y clic fuera (contrato actual: `open`, `onClose`, `title`, `description`, `children`, `className`).
- **Adaptación:** Mantener la implementación actual (div-based) para no romper el contrato ni el comportamiento de foco ya probado; no cambiar a `<dialog>`.

### 6.6 `var(--color-*)` CSS variables
La guía referencia `var(--color-bronce-600)`, `var(--font-sans)` en estilos en línea y CSS.
- **Adaptación:** Usar clases Tailwind 3 (`bg-bronce-600`, `font-sans`) definidas en `tailwind.config.js`; no usar variables CSS sueltas.

---

## 7. Notas y decisiones pendientes de confirmación (Fase B)

1. **No se agregarán dependencias** (`clsx`, `tailwind-merge`, `lucide-react` mayor, etc.) sin aprobación explícita.
2. `calcularNoches` ya existe en `src/features/mis-reservas/formato.ts` con comportamiento distinto a la guía; no se modifica para no romper páginas existentes (`AdminReservaDetallePage`, `AdminReservasList`, `ReservaDetalle`, `ReservaCard`).
3. `formatQ`, `fechaCorta`/`fechaLarga`/`rangoNoches`/`dateKey` y `calcularReembolsoEvento` no existen en `src/`; se crearían en `src/utils/` solo si se confirma su uso.
4. Los textos nuevos se agregarán a `src/i18n/es.ts` manteniendo el trato formal de "usted".
5. No se tocará lógica de negocio, rutas ni llamadas a la API.

---

**Detengo aquí (FIN DE FASE A).** Muestro la tabla de §5 para su confirmación de qué componentes adaptar. Espero su instrucción antes de iniciar la Fase B.
