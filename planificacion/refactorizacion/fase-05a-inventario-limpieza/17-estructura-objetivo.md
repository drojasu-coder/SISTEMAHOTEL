# Estructura objetivo propuesta

La estructura conceptual puede converger hacia:

```text
/
├── backend/
├── frontend/
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── academic/
│   └── refactoring/
├── infrastructure/
├── README.md
└── archivos de configuración raíz
```

Alternativa conservadora: mantener `planificacion/refactorizacion/` y crear
`docs/` sólo para documentación operativa, sin mover historial. Esta opción
reduce riesgo de enlaces rotos.

Recomendación: comparar ambas en 5B y decidir con confirmación antes de
mover archivos. No se aplicó ninguna reorganización.
