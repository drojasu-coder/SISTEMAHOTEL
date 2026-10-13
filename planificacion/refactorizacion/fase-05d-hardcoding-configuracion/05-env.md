# Variables de entorno

Las variables existentes se conservaron con sus nombres y defaults. No se
añadieron variables nuevas porque no hubo un valor técnico nuevo que variara
por deployment.

Se revisaron PORT, NODE_ENV, DATABASE_URL, TEST_DATABASE_URL, JWT, Stripe,
CORS, logging, rate limit, body limits y configuración de requests.

`SLOW_QUERY_THRESHOLD_MS` se conserva como configuración existente; no se
implementó logging de slow queries, que sería una feature nueva.
