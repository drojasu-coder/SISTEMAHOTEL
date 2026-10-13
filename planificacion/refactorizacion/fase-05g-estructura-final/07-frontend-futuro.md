# 07 — Frontend futuro

Fase 6 podrá crear la aplicación React + TypeScript + Vite con Tailwind,
React Router, TanStack Query, React Hook Form + Zod, Vitest y React Testing
Library.

Arquitectura candidata:

```text
Frontend/src/
├── app/{config,providers,router}
├── api/{client,generated,endpoints}
├── components/{ui,shared}
├── features/{auth,habitaciones,reservas,pagos,parqueos,administracion}
├── layouts/
├── hooks/
├── schemas/
├── types/
├── utils/
└── styles/
```

No se crean directorios ahora. La implementación debe preservar los JPG,
`.pen` y `GUIA-DISENO.md`, preferiblemente separándolos después en una carpeta
de diseño mediante una decisión explícita.
