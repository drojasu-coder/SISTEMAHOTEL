# Configurabilidad

| Área | Clasificación | Observación |
|---|---|---|
| PostgreSQL | variable de entorno | `DATABASE_URL`/`TEST_DATABASE_URL` |
| JWT | variable de entorno | secreto y expiración |
| Stripe | variable de entorno | clave y firma webhook |
| CORS | variable de entorno | orígenes permitidos |
| límites HTTP | variable/constante | body, webhook y rate limit |
| IVA | regla/configuración | módulo configuraciones coordinado |
| precios parque | regla/configuración | valores específicos de dominio |
| estados | constante de dominio | existen literales distribuidos |
| puertos/URLs | variable de entorno | revisar en Fase 5 |

No se modificó configuración. Los valores de test no son secretos
productivos. Fase 5 debe separar variables de ambiente, constantes válidas,
reglas de dominio y hardcoding sospechoso.
