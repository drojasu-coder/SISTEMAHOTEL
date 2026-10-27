# Hotel Hunapú — Frontend

Aplicación web para el sistema de gestión y reservas de Hotel Hunapú.

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS
- React Router v6
- TanStack Query v5
- React Hook Form + Zod
- Vitest + React Testing Library
- openapi-typescript

## Variables de Entorno
Copiar archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

Configuración requerida:
```env
VITE_API_BASE_URL=http://localhost:4000/api
```

## Referencia Visual y Diseño
- **Referencia visual oficial:** Prototipo web publicado (`https://hotel-hunahpu-prototipo.diegoantoniorojasuyu.chatgpt.site`). El prototipo sirve como referencia visual base, no como especificación rígida a copiar ciegamente.
- **Responsive mobile-first:** Toda la interfaz se diseña mobile-first y debe funcionar correctamente en móvil, tablet, laptop y desktop.
- **Política de assets:** El branding estático se ubica exclusivamente en `src/assets/branding/`. El contenido dinámico de catálogo (fotos de habitaciones, servicios, actividades) se gestionará en almacenamiento de objetos (AWS S3) en fases posteriores.

## Comandos Disponibles

### Instalación de dependencias
```bash
npm install
```

### Servidor de desarrollo
```bash
npm run dev
```
Inicia la aplicación localmente en `http://localhost:5173/`.

### Verificación de tipos TypeScript
```bash
npm run typecheck
```

### Ejecución de pruebas
```bash
npm test
```

### Compilación para producción
```bash
npm run build
```

### Generación de tipos OpenAPI
```bash
npm run api:generate
```
Exporta el contrato Swagger actual del backend y genera los tipos TypeScript en `src/api/generated/schema.ts`.
