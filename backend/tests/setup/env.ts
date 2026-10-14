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