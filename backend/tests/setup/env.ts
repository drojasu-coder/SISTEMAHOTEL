/**
 * Variables exclusivas para pruebas automáticas.
 *
 * Nunca deben contener secretos reales.
 */

process.env.NODE_ENV =
  "test";

process.env.PORT =
  "4001";

process.env.JWT_SECRET =
  "qa-automation-secret-key-for-sistemahotel-2026";

process.env.JWT_EXPIRES_IN =
  "1h";

process.env.EVENT_DEPOSIT_PERCENTAGE =
  "30";

process.env.TRANSPORT_BLOCK_MINUTES =
  "120";

process.env.CART_EXPIRATION_MINUTES =
  "15";

process.env.PARK_TICKET_PRICE_ADULT =
  "100";

process.env.PARK_TICKET_PRICE_CHILD =
  "50";

process.env.PARK_TICKET_PRICE_FAMILY =
  "250";

process.env.APP_TIMEZONE =
  "America/Guatemala";

/**
 * Stripe se configurará específicamente
 * cuando lleguemos al módulo de pagos.
 *
 * Nunca usaremos claves de producción.
 */
process.env.STRIPE_SECRET_KEY =
  "sk_test_qa_automation_fake_key";

process.env.STRIPE_WEBHOOK_SECRET =
  "whsec_qa_automation_fake_secret";

/**
 * Base aislada de pruebas (docker-compose.test.yml). sequelize.config.js
 * rechaza cualquier otra URL en NODE_ENV=test.
 */
process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgres://hotel_test_user:hotel_test_password@127.0.0.1:55432/hotel_test_db";

/**
 * La suite QA autentica un usuario por prueba mediante /api/auth/login.
 * El límite de producción (10 por minuto) la bloquearía con 429, por lo que
 * se eleva solo en este entorno. El límite se verifica en tests/integration.
 */
process.env.AUTH_RATE_LIMIT_MAX = "100000";
