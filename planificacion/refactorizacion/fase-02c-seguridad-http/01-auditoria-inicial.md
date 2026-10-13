# Fase 2C - Auditoria de seguridad HTTP

## Hallazgos previos

- `app.ts` usaba `cors()` sin restricciones de origen.
- No se configuraban cabeceras de seguridad ni se deshabilitaba
  `X-Powered-By`.
- No existia rate limiting.
- `express.json` tenia limite de 1 MB; el webhook raw no tenia limite explicito.
- No se configuraba `trust proxy`.
- JWT y roles ya estaban implementados en middlewares de ruta.
- El webhook Stripe estaba antes de `express.json`, usaba raw body y no tenia
  JWT; ese orden se conserva.

## Distincion

Las rutas y middlewares se revisaron mediante analisis estatico. CORS, headers,
rate limit, limites de body, JWT y webhook se verifican con pruebas HTTP.
