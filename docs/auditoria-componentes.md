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

**Estado tras Lote 2 (completado):** Los siguientes componentes de la tabla de §5 ya están implementados en `src/components/ui/`:

| Componente de la guía | Estado tras Lote 2 | Archivo |
|-----------------------|--------------------|---------|
| `Card` (+ Header/Content/Footer) | ✅ Hecho (adaptado) | `src/components/ui/Card.tsx` |
| `Field` | ✅ Hecho (nuevo) | `src/components/ui/Field.tsx` |
| `Select` | ✅ Hecho (nuevo) | `src/components/ui/Select.tsx` |
| `Textarea` | ✅ Hecho (nuevo) | `src/components/ui/Textarea.tsx` |
| `Checkbox` | ✅ Hecho (nuevo) | `src/components/ui/Checkbox.tsx` |
| `Radio` | ✅ Hecho (nuevo) | `src/components/ui/Radio.tsx` |
| `Switch` | ✅ Hecho (nuevo) | `src/components/ui/Switch.tsx` |
| `DateField` | ✅ Hecho (nuevo) | `src/components/ui/DateField.tsx` |
| `TimeField` | ✅ Hecho (nuevo) | `src/components/ui/TimeField.tsx` |
| `Pagination` | ✅ Hecho (nuevo) | `src/components/ui/Pagination.tsx` |
| `Table` | ✅ Hecho (nuevo) | `src/components/ui/Table.tsx` |

Los componentes se integran sin romper contratos existentes: `Button` conserva sus variantes `primary/secondary/ghost/danger` y `isLoading`; `Input` conserva su contrato de `forwardRef`. No se integró ninguno en páginas todavía.

Espero su instrucción para iniciar el **Lote 3**.

## Ficha 2 · Parte B: componentes canónicos y adopción (2026-10-26)

Esta sección actualiza la auditoría histórica: la Parte B fue autorizada e implementada sobre los componentes ya presentes. Las referencias anteriores a esperar Lote 3 describen aquel punto de la auditoría; no representan un bloqueo actual. Se mantuvieron React 18, Tailwind 3 y los tokens existentes. No se copió el proyecto de referencia de `MATERIAL-HOTEL` ni se añadieron dependencias.

### Componentes canónicos

Rutas relativas a `Frontend/src/`:

| Necesidad | Componente canónico | Decisión y responsabilidad |
| --- | --- | --- |
| Contenedor | `components/shared/PageContainer.tsx` | Nuevo. `variant="public"` comparte max-w-7xl, px-4/sm:px-6/lg:px-8, py-10 y gap-8; `admin` conserva ancho del padre y no migra el panel. |
| Encabezado | `PageHeader` en el mismo archivo | Nuevo. Un h1, eyebrow/description/action/context/breadcrumbs opcionales. No añade un encabezado al hero de Inicio. |
| Filtros | `components/shared/CatalogFilters.tsx` | Nuevo. Composición de Input/Select/Button/Modal/Pagination existentes; búsqueda visible, chips removibles, limpiar, total y enlace compartido. Solo el panel móvil monta los selects mientras está abierto. |
| Estado de URL | `features/preferencias/useCatalogUrl.ts` | Nuevo. q, zona/tipo, page, sede; conserva parámetros ajenos y fragmento. Valores validados/defaults. Búsqueda con replace, filtros/páginas con historial; cambios locales restablecen página. |
| Tarjeta | `components/shared/ServiceCard.tsx` | Nuevo, compuesto sobre Card. Media, nombre, sede, datos, precio y acción por slots; sin permisos ni cálculos de negocio internos. h2 por defecto, h3 en resultados bajo un h2. |
| Imagen/crédito | `ServiceMedia` en el mismo archivo | Nuevo. URL exacta de API, dimensiones reservadas 16:9, variante panorama solo para banner de restaurante, lazy por defecto, prioridad explícita. Fallback neutro, sin reintentar infinitamente la URL fallida; acepta URL renovada de la capa existente. Créditos completos fuera de imagen. |
| Superficie | `components/ui/Card.tsx` | Ajustado. Conserva div/padding por defecto. `as="article" padding="none"` permite composición semántica sin padding duplicado. |
| Campos | `components/ui/Field.tsx`, `Input.tsx` | Ajustados. Field único: se retiró FieldShell tras migrar Input/PasswordInput. Etiqueta, ayuda/error y ARIA; useId incondicional; carga etiquetable y error ReactNode. Controles nativos directos reciben la asociación sin perder ref/RHF. |
| Select/Checkbox | `components/ui/{Select,Checkbox}.tsx` | Reutilizados en filtros y formularios; sin un segundo sistema de controles. |
| Fecha/hora | `components/ui/{DateField,TimeField}.tsx` | Ajustados para aceptar el contrato completo de Input (incluido error). Siguen siendo date/time nativos. No hay nuevo selector avanzado de Ficha 3. |
| Botones | `components/ui/Button.tsx` y `buttonStyles` | Ajustados con forwardRef y variante `text`. Se conservan primary/secondary/danger/ghost y tamaños; enlaces usan buttonStyles, nunca un Button anidado. Tarjetas usan acción secundaria; el diálogo tiene su principal. |
| Carga/vacío/error | `DataState`, `Skeleton`, `EmptyState`, `ErrorState` | Ajustados con slots/etiquetas, nivel de heading y mensajes/acciones propios. `shared/CatalogState` adopta esos componentes y `CatalogSkeleton` los compone en grid. No muestra errores internos ni informa cero mientras carga. |
| Paginación | `components/ui/Pagination.tsx` | Ajustado con labels opcionales; mantiene API/default español para consumidores previos. Los cinco catálogos paginan localmente colecciones completas a 9 elementos, mostrando el total filtrado antes de paginar. |
| Diálogo | `components/ui/Modal.tsx` | Ajustado y reutilizado. Foco inicial seguro, trap/Escape/restauración, scroll y busy. La capa visual bloquea cierre durante mutación; no promete abortar la solicitud. Mantiene su contrato div/aria-modal y opciones previas. Navbar y SitePicker delegan el scroll al Modal, evitando locks duplicados. |
| Notificaciones | `components/ui/Toast.tsx` | Ajustado el sistema existente: máximo 3 visibles, resto en cola sin pérdida; errores/advertencias persistentes por defecto, info/éxito con 7 s mínimos y pausa por hover/foco. Posición inferior derecha; alert para error y status para los demás. Los catálogos conservan avisos inline persistentes con Alert; no se inventaron toasts de éxito. |
| Estado | `components/ui/StatusBadge.tsx` sobre Badge | Nuevo. Mapas explícitos reservation/payment/cart/room/table/service y etiquetas ES/EN. Confirmada no significa pagada; pendiente no implica pago. Desconocido neutral traducido y diagnóstico de consola una vez por estado, sin código crudo en UI. |
| Moneda | `components/ui/MoneyReference.tsx` | Reutilizado de Ficha 1. GTQ y USD aproximado con única configuración; ausencia distinta de cero. Sin impuestos incluidos globales ni cambios de precio/cálculo/payload. |
| Desglose/tabla/progreso | `PriceSummary`, `Table`, `StatusTimeline`, `Stepper`, `Tabs` | Inspeccionados y conservados. Los catálogos no tienen un desglose fiscal verificado, tablas o flujo por pasos que justifique insertarlos. No se añadieron pantallas para forzar adopción. |

### Ejemplos de composición

```tsx
<PageContainer>
  <PageHeader eyebrow={t.subtitulo} title={t.catalogoTitulo}
    description={t.catalogoDescripcion} context={<CatalogSiteNotice />} />
  {/* CatalogFilters recibe el hook de URL y los filtros propios del catálogo. */}
</PageContainer>

<ServiceCard name={<span lang="es">{recurso.nombre}</span>}
  media={<ServiceMedia src={recurso.imagen_url} alt={recurso.nombre}
    credits={recurso.imagen_creditos} />}
  price={<MoneyReference amount={recurso.precio} />}
  action={<Button variant="secondary" onClick={abrirReserva}>{t.reservar}</Button>} />

<DateField label={t.fecha} {...register('fecha')} error={errors.fecha?.message} />
<Modal open={open} title={tituloConcreto} onClose={cerrar}
  busy={mutation.isPending} busyLabel={p('processingRequest')}>
  {/* Consecuencia/resumen del recurso y acción principal existente. */}
</Modal>
```

Los nombres `recurso`, `t.reservar` y callbacks del ejemplo son ilustrativos: cada consumidor pasa los campos reales de su contrato; no constituyen un DTO nuevo. En una tarjeta sin tarifa contractual se omite el slot `price`.

### Consumidores migrados

- Catálogos: `CatalogoRestauranteCliente`, `CatalogoAmenidadesCliente`, `CatalogoActividadesCliente`, `CatalogoBienestarList`, `CatalogoSalonesList`.
- Detalle público: `eventos/components/SalonDetalleCard` adopta contenedor/encabezado, breadcrumb, media y estados. Mantiene la sede real del salón y la adopción explícita de sede global.
- Acceso a Habitaciones: `pages/PublicHabitacionesPage` adopta contenedor/encabezado; **no se creó un catálogo** (BE-015).
- Resultados vigentes de habitaciones: `crear-reserva/components/HabitacionesDisponiblesList` adopta ServiceCard/Media y estados, conservando selección, criterios y montos estimados del servidor. `pages/CrearReservaPage` adopta encabezado/contenedor sin cambiar autorización ni búsqueda.
- Formularios públicos de mesa, amenidad, actividad, cita y evento: controles compartidos y Modal; campos, validaciones, payloads, condiciones de sede incompatible y tratamiento de incertidumbre conservados. La etiqueta de estimación previa de actividad identifica su naturaleza; no se recalculó ni cambió el total existente.
- Importes públicos de tarjetas, detalle de salón, formularios/resúmenes y confirmaciones de habitación/actividad/cita usan MoneyReference. Restaurante y amenidades siguen sin precios ficticios.
- `pages/PublicSedesPage` comparte contenedor/encabezado y media con atribución fuera de imagen. Sus contactos reales y adopción de sede al reservar se conservan.

### Reglas de URL, datos y exclusiones

- Un enlace a un catálogo dependiente de sede incluye `sede=all` o ID real. Si difiere de la preferencia, CatalogLinkContext pide aplicarla o usar la actual, y retiene los resultados hasta esa decisión. Aplicar el enlace conserva su página/filtros. Una sede inexistente no puede aplicarse. Cambiar sede desde el control global restablece la página; limpiar filtros nunca borra la preferencia de sede.
- Se inspeccionaron los `findAll` de mesa, amenidad, recursoActividad, servicioSpa y salón: sus lecturas actuales no usan limit/offset. Por eso el total es del arreglo completo filtrado, no el tamaño de la página visible. Una futura API paginada exige consumir su total/página del servidor; no reutilizar la cuenta local de este contrato a ciegas.
- Bienestar no tiene relación de sede y no la inventa: comparte búsqueda/página, sin aplicar ese contexto.
- Siguen abiertos BE-015/016/017, contenido legal aprobado y semántica fiscal de Parte A. Editorial/alt de base de datos siguen originales españoles marcados; interfaz nueva y atributos accesibles son ES/EN. Identificadores internos de mesa no se presentan como nombres comerciales; se conservan números de reserva y códigos de acceso útiles.
- Fuera de adopción coordinada: checkout/pagos/reembolsos, facturación y panel administrativo; detalles de Mis reservas y sus confirmaciones de cancelación. No se alteraron endpoints, permisos ni reglas. No se añadió un ConfirmDialog sin consumidor público destructivo. Cuando se migren las cancelaciones privadas, usar Modal con opción segura “Conservar reserva”, acción “Cancelar reserva”, nombre/consecuencia concretos y bloqueo de doble envío.
- PriceSummary conserva su contrato anterior para migración posterior; no se deducen impuestos para alimentar sus props. Table/StatusTimeline/Stepper/Tabs permanecen sin adopción nueva en este alcance.
- Sin eliminación de archivos. Se retiraron los bloques duplicados al migrar sus consumidores: FieldShell, cinco encabezados/filtros/estados/grids locales, cuatro overlays manuales, y créditos superpuestos en las vistas migradas. Búsqueda `rg` en esos consumidores confirma ausencia de FieldShell, img directos, animate-pulse y role=dialog manual. La prueba de Eventos comprueba ausencia de `a button`/`button a` y conserva destinos/acciones.

### Adopción posterior autorizada en Ficha 3A

- `habitaciones/public/RoomCatalog` y `RoomDetail` consumen PageContainer/PageHeader, CatalogFilters, ServiceCard/ServiceMedia, estados, Modal y MoneyReference; la lectura sigue condicionada al contrato autenticado vigente (BE-015).
- CatalogFilters añade labels por valor para tipos/orden, filtros adicionales componibles y etiquetas removibles de precio; su API previa sigue siendo compatible. `useCatalogUrl` admite updates de criterios y un alias de sede solo cuando el consumidor lo declara. No añade otra preferencia global.
- `RoomSearchPanel` compone DateField/Input/Modal y el rango accesible de react-day-picker 9.13.0. Fechas ISO/hoy Guatemala y selección de rango independiente de inventario; 2 meses escritorio, 1 móvil. Esta dependencia está justificada por rango, teclado e idiomas, y no actualiza las versiones principales existentes. Documentación oficial en https://daypicker.dev/v9/api/interfaces/PropsBase.
- El patrón de cancelación/resultado incierto se conserva: no se interpreta cerrar un modal como abortar un POST, ni se reenvía una creación incierta. El guard del resumen legado y el nuevo detalle bloquean duplicados, sin cambiar el contrato financiero.
- Rutas/clientes/matriz y evidencia de 3A: `docs/mejoras-ux.md`; dependencias públicas, datos ampliados y políticas/fiscalidad: BE-015/018/019. No se declara migrado checkout ni el panel.

### Ficha 3B · Acceso público y continuidad

- `AuthPageLayout`: ancho único `max-w-md`, marca `Brand` ya conectada a S3/fallback, `LanguageSelector`, vuelta al sitio y aviso traducido del borrador. `GuestLayout` omite topbar, menú, primera visita y footer solo en `/login` y `/registro`; conserva los proveedores existentes.
- `LoginForm` / `RegisterForm`: reutilizan Input, PasswordInput, Select, Button, Alert y TranslatedError. Autocompletado y pegado permitidos; contraseña literal; bloqueo de doble envío sin retry automático. Reglas reales visibles (8–72, mayúscula ASCII, minúscula ASCII, número); nombre completo Unicode sin inferir apellidos. Teléfono opcional normalizado con prefijo elegido, sin país preseleccionado; país del selector no se envía como residencia.
- `secureReturn` + `routing`: origen comprobado con URL, lista explícita de rutas de AppRouter y permisos existentes. Rechaza rutas codificadas, normalizadas, externas, protocol-relative, controles, backslash, fragmentos y bucles de acceso. Solo parámetros permitidos; permisos de navegación no sustituyen al backend.
- `reservationDraft` + `useAuthReturn`: una sola implementación compartida con los exports de 3A. Restaura únicamente `{version:1,path}` validado, con fechas reales, rango ordenado e identificadores/filtros válidos; no guarda identidad/precio/token/contraseña. Una entrada explícita rechazada no recupera un borrador previo al alternar pantallas.
- Se mantiene el aborto y aislamiento de consultas de AuthContext; solo se añade el código semántico del aviso para traducirlo. No se modifica checkout ni se borran claves de idempotencia. Recuperación y políticas: BE-020 a BE-022.

### Ficha 3C · Compra del cliente

- `features/compra/PurchaseSteps` reutiliza Stepper: Carrito → Pago → Confirmación, `aria-current=step`, etiqueta ES/EN y regreso al carrito solo cuando no hay intento/resultado por recuperar. El paso Datos completo depende de BE-023; `AccountContact` muestra únicamente cuenta autenticada, sin formularios descartados ni cambios de perfil.
- `CartExpiry` reutiliza Countdown con fecha autoritativa, foco/visibilidad y mensajes de umbral; el reloj no anuncia cada segundo. `verifyCartPayment` realiza solo lecturas con claves canónicas de pagos antes de reconsultar un carrito vencido. Mantiene ID de pago o estado incierto para recuperación, sin crear ni descartar operaciones.
- `useCartPaymentLock` bloquea retiradas mientras se consulta un intento, si existe uno (incluido incompleto/sin identificador), si la consulta falla o si existe pago guardado para esa cuenta/carrito. Se conserva confirmación con nombre, DELETE 204, resultado de red incierto y no cancelación de reservas; se añade cerrojo síncrono contra doble retirada.
- `PurchaseItemDetails` usa APIs ya existentes para habitación/evento/actividad/bienestar, valida referencia y propietario, limita a dos lecturas simultáneas y separa precios persistidos de datos descriptivos/estado operativo. No consulta disponibilidad pública ni recalcula importes. Otros tipos se muestran solo si el servidor los devuelve, sin crear nuevos flujos por un enum. `groupItems` solo agrupa presentación, sin subtotales.
- Resúmenes de carrito/checkout y resultado usan MoneyReference para GTQ primero y USD aproximado, convirtiendo cada total completo desde configuración común. El botón de Stripe contiene el importe y moneda del intento; diferencias carrito/resumen, intento/saldo o moneda bloquean confirmación. No se toca el backend financiero.
- `PurchaseReservations` consulta ítems del carrito DEL PAGO, incluido historial y origen directo con `carrito_id=null`, sin buscar el carrito actual para reconstruir importes. Solo el regreso desde rechazo/cancelación comprueba que el carrito vigente corresponde al mismo pago; un carrito nuevo no recibe el intento antiguo.
- Stripe Elements/PaymentElement, confirmación explícita, 3DS/return_url, claves por usuario+carrito, recuperación, mutaciones sin retry y aprobación contra backend permanecen en el flujo existente. La revalidación de vencimiento bloquea temporalmente el botón sin desmontar Elements ni perder su entrada. Sondeo de resultado limitado a 60 segundos, con consulta manual para reanudar y lectura al volver al foco.
- Textos públicos `carrito`, `checkout` y `pagos` se incorporan al mecanismo de claves existente (`purchase.en.ts`). Mensajes de mutación guardan claves semánticas para cambio de idioma inmediato; datos editoriales/errores desconocidos del servidor conservan su idioma. No se introduce un segundo proveedor.
- `calendar.ts`: exportación local explícita solo para habitaciones con rango real; fechas de día completo y salida exclusiva, sin hora de check-in inventada; Unicode escapado y plegado UTF-8, pendiente como TENTATIVE. No equivale a factura ni envía correos.
