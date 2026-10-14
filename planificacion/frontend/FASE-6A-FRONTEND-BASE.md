# Hotel Hunapú — Registro Técnico Fase 6A: Frontend Base y Scaffold

---

## 1. Baseline de Inicio

- **Backend finalizado y cerrado en:** `0a4bd99`
- **Gate de entrada:** `GO_FRONTEND_BASE`
- **Condición:** Repositorio backend limpio, suites 65/65 pruebas pasadas y TypeScript verificado.

---

## 2. Commits Principales de Fase 6A

1. **`34c65ef`** — `fix: complete carrito OpenAPI schema`  
   Corrección canónica del contrato OpenAPI agregando el esquema `Carrito` en `backend/src/docs/swagger.ts`.
2. **`6c4c7cb`** — `feat: scaffold hotel frontend application`  
   Scaffold completo de la aplicación web React + Vite + Tailwind en `Frontend/` con router, providers, tests y codegen OpenAPI.
3. **`7ebbb27`** — `refactor: organize branding and improve responsive frontend`  
   Ajuste mobile-first transversal (drawer móvil en `AdminLayout`, menú hamburguesa en `Navbar`, touch targets) y organización de branding oficial en `src/assets/branding/`.

- **HEAD actual verificado:** `7ebbb27`

---

## 3. Objetivo de Fase 6A

Construcción del scaffold y arquitectura base funcional de la aplicación web de Hotel Hunapú sobre `Frontend/`, integrando la pila técnica aprobada:

- **Framework & Build:** React 18, TypeScript, Vite
- **Estilos:** Tailwind CSS (diseño mobile-first transversal)
- **Enrutamiento:** React Router v6
- **Manejo de Estado & Caché:** TanStack Query v5 (`QueryClientProvider`)
- **Formularios & Validación:** React Hook Form + Zod
- **Testing:** Vitest + React Testing Library
- **Contrato de API:** openapi-typescript (generación automática de tipos)

---

## 4. Estructura Implementada

Estructura modular en `Frontend/src/`:

- **`src/app/`**: Configuración de entorno (`env.ts`), providers globales (`AppProviders.tsx`), enrutador (`AppRouter.tsx`) y pruebas de integración/smoke.
- **`src/api/`**: Cliente HTTP tipado sobre `fetch` nativo (`http.ts`), clase unificada `ApiError` y tipos generados desde OpenAPI (`src/api/generated/schema.ts`).
- **`src/components/`**: Primitivas de UI (`Button`, `Card`, `Input`) y layout compartido (`Navbar`, `Footer`).
- **`src/features/`**: Módulos funcionales de negocio (ej. `auth` con schemas Zod y componente `LoginForm`).
- **`src/layouts/`**: `GuestLayout` (sitio público) y `AdminLayout` (panel administrativo con drawer móvil responsivo).
- **`src/pages/`**: Vistas públicas y administrativas (`HomePage`, `LoginPage`, `AdminPage`, `ForbiddenPage`, `NotFoundPage`).
- **`src/assets/branding/`**: Logotipos e isotipos institucionales organizados.
- **`src/styles/`**: Variables de diseño, fuentes y directivas de Tailwind CSS.
- **`src/test/`**: Configuración global de entorno de pruebas (`setup.ts`).

---

## 5. Funcionalidad Base

- **Rutas operativas:**
  - `/` — Página de inicio con sedes, servicios y accesos directos.
  - `/login` — Formulario de login interactivo con validación Zod.
  - `/admin` — Panel de control base con métricas e indicadores de infraestructura.
  - `/403` / `/forbidden` — Pantalla de acceso no autorizado responsiva.
  - `*` — Pantalla 404 para rutas no existentes.
- **Infraestructura HTTP & Datos:**
  - `QueryClient` configurado globalmente para invalidación y mutaciones.
  - Cliente HTTP tipado con soporte nativo para headers Bearer y respuestas JSON.
  - Generador OpenAPI → TypeScript mediante `npm run api:generate`.
- **Responsive & Accesibilidad:**
  - Diseño mobile-first probado en resoluciones móvil, tablet, laptop y desktop.
  - Sidebar administrativo transformado en navegación drawer off-canvas en pantallas menores a `lg` (evitando ocupar 264px fijos).
  - Menú hamburguesa móvil en barra pública con touch targets $\ge 44\text{px}$.

---

## 6. Contrato OpenAPI

- **Dimensiones del contrato:** 93 paths, 184 operaciones.
- **Resolución técnica:** Durante la fase se detectó que los endpoints de carrito referenciaban `#/components/schemas/Carrito` sin que existiera la definición en el OpenAPI del backend. Se definió canónicamente en `backend/src/docs/swagger.ts`.
- **Integridad:** Se eliminó cualquier workaround o inyección manual en memoria del frontend; el generador extrae el contrato directo del backend.

---

## 7. Branding y Política de Assets

- **Branding estático oficial:** Reside exclusivamente en `Frontend/src/assets/branding/`:
  - `logo-principal.jpg`
  - `logo-footer-blanco.jpg`
  - `isotipo-color.jpg`
  - `isotipo-pos-1bit.jpg`
  - `logo-facturacion-monocromo.jpg`
  - `logo-facturacion-monocromo-blanco.jpg`
- **Contenido dinámico de catálogo:** Fotografías de habitaciones, tours, restaurante y sedes serán servidas desde almacenamiento de objetos (AWS S3) en fases posteriores. No se almacenan en `public/`.
- **Archivos retirados:** Se eliminaron `Frontend/GUIA-DISENO.md` y `Frontend/diseno-hotel.pen` al dejar de ser fuentes de diseño activas.

---

## 8. Referencia Visual Oficial

- **Referencia visual base:** `https://hotel-hunahpu-prototipo.diegoantoniorojasuyu.chatgpt.site`
- **Criterios de aplicación:**
  - Funciona como guía visual y conceptual, no como especificación rígida a replicar sin criterio.
  - Se optimiza activamente durante el desarrollo de cada módulo.
  - La adaptabilidad responsive mobile-first rige sobre cualquier elemento estático del prototipo.

---

## 9. Validaciones Finales de Fase 6A

### Frontend
- **TypeScript:** Exitoso sin errores (`tsc --noEmit`).
- **Tests unitarios y componentes:** **10 / 10 pasados** (4 suites de pruebas).
- **Compilación producción:** Build Vite exitoso (`dist/`).

### Backend (Post-corrección OpenAPI)
- **Tests totales:** **65 / 65 pasados**.
  - Unitarios: 37 / 37 pasados.
  - Integración: 28 / 28 pasados.
- **TypeScript:** Exitoso sin errores (`tsc --noEmit`).
- **OpenAPI:** 93 paths, 184 operaciones verificadas.

---

## 10. Estado y Siguiente Fase

- **Fase 6A:** **APROBADA**
- **Siguiente paso:** **FASE 6B — AUTENTICACIÓN REAL FRONTEND ↔ BACKEND**
