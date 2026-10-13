# 6. Arquitectura TO-BE propuesta

## Alternativas

| Alternativa | Beneficio | Coste/riesgo | Decisión |
|---|---|---|---|
| Mantener capas globales | Menor cambio | Límites débiles y conflictos | Sólo transición |
| Monolito modular | Límites por funcionalidad, despliegue actual y pruebas incrementales | Requiere disciplina de imports | Recomendada |
| Ports/adapters completo | Aislamiento fuerte | Muchas abstracciones para el tamaño actual | Sólo en Stripe/persistencia si se justifica |
| Microservicios | Independencia de despliegue | Complejidad operativa, transacciones distribuidas | Rechazada |

## Árbol objetivo no implementado

```text
src/
  modules/
    identity/{routes,controllers,services,validators}
    lodging/{routes,controllers,services,validators}
    experiences/{routes,controllers,services,validators}
    operations/{routes,controllers,services,validators}
    commerce/{routes,controllers,services,validators}
    payments/{routes,controllers,services,validators,integrations}
  platform/{config,middlewares,errors,observability}
  models/                 # permanece compatible durante la transición
  migrations/             # permanece fuera de la migración modular
```

La primera etapa debe permitir que el módulo nuevo consuma los modelos existentes. No se deben mover migraciones ni reescribir asociaciones.

## Compatibilidad

El montaje actual puede conservar rutas públicas mientras cada router delega a una fachada modular. Esto reduce riesgo para OpenAPI, Sequelize CLI, frontend y la rama de José.

