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
