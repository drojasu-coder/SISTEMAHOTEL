import "dotenv/config";
import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const nonNegativeInteger = (fallback: number) =>
  z.coerce.number().int().min(0).default(fallback);

const booleanFromEnv = z.preprocess((value) => {
  if (value === undefined) return false;
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  APP_TIMEZONE: z.string().min(1).default("America/Guatemala"),
  CORS_ORIGINS: optionalString,
  TRUST_PROXY: nonNegativeInteger(0),
  REQUEST_BODY_LIMIT: z.string().min(1).default("1mb"),
  WEBHOOK_BODY_LIMIT: z.string().min(1).default("512kb"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  LOG_FORMAT: z.enum(["pretty", "json"]).default("pretty"),
  SERVICE_NAME: z.string().min(1).default("hotel-hunapu-backend"),
  SLOW_QUERY_THRESHOLD_MS: z.coerce.number().int().positive().default(1000),

  EVENT_DEPOSIT_PERCENTAGE: z.coerce
    .number()
    .gt(0, "EVENT_DEPOSIT_PERCENTAGE debe ser mayor que 0")
    .lte(100, "EVENT_DEPOSIT_PERCENTAGE no puede superar 100"),
  TRANSPORT_BLOCK_MINUTES: z.coerce
    .number()
    .int()
    .positive("TRANSPORT_BLOCK_MINUTES debe ser mayor que cero")
    .default(120),
  CART_EXPIRATION_MINUTES: z.coerce
    .number()
    .int()
    .positive("CART_EXPIRATION_MINUTES debe ser mayor que cero")
    .default(15),
  // Expiración de reservas de habitación pendientes. Desactivada por defecto: se habilita
  // explícitamente solo después de aplicar la migración expira_en y regularizar las reservas históricas.
  RESERVA_PENDIENTE_EXPIRACION_ACTIVA: booleanFromEnv,
  RESERVA_PENDIENTE_TTL_MINUTOS: z.coerce.number().int().min(5).max(1440).default(30),
  RESERVA_EXPIRACION_INTERVALO_SEGUNDOS: z.coerce.number().int().min(15).max(3600).default(60),
  RESERVA_EXPIRACION_GRACIA_PAGO_MINUTOS: z.coerce.number().int().min(5).max(1440).default(30),
  RESERVA_EXPIRACION_LOTE: z.coerce.number().int().min(1).max(500).default(50),
  PARK_TICKET_PRICE_ADULT: z.coerce.number().positive("PARK_TICKET_PRICE_ADULT debe ser mayor que cero"),
  PARK_TICKET_PRICE_CHILD: z.coerce.number().positive("PARK_TICKET_PRICE_CHILD debe ser mayor que cero"),
  PARK_TICKET_PRICE_FAMILY: z.coerce.number().positive("PARK_TICKET_PRICE_FAMILY debe ser mayor que cero"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().min(1).default("1h"),
  GOOGLE_LOGIN_ENABLED: booleanFromEnv,
  GOOGLE_CLIENT_ID: z.preprocess(emptyToUndefined,
    z.string().regex(/^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/).optional()),
  DATABASE_URL: optionalString,
  TEST_DATABASE_URL: optionalString,
  STRIPE_ENABLED: booleanFromEnv,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,

  // AWS S3
  AWS_REGION: z.string().min(1).default("us-east-2"),
  AWS_S3_BUCKET: z.string().min(1).default("hotel-hunahpu-media-2026"),
  AWS_PROFILE: optionalString,

  // AWS CloudFront
  CLOUDFRONT_BASE_URL: optionalString,
});

export type Env = z.infer<typeof envSchema>;

const formatIssues = (issues: z.ZodIssue[]) =>
  issues
    .map((issue) => `${issue.path.join(".") || "configuración"}: ${issue.message}`)
    .join("; ");

const validateDatabase = (values: Env) => {
  if (values.NODE_ENV === "test") {
    if (!values.TEST_DATABASE_URL) {
      throw new Error("TEST_DATABASE_URL es obligatoria en el ambiente de pruebas");
    }

    const url = parseDatabaseUrl(values.TEST_DATABASE_URL, "TEST_DATABASE_URL");
    if (
      !["127.0.0.1", "localhost"].includes(url.hostname) ||
      !["55432", "55433"].includes(url.port) ||
      url.pathname !== "/hotel_test_db"
    ) {
      throw new Error(
        "TEST_DATABASE_URL debe apuntar exclusivamente a localhost:55432/hotel_test_db (o puerto 55433 para pruebas aisladas)",
      );
    }
  } else if (values.NODE_ENV === "development") {
    if (!values.DATABASE_URL) {
      throw new Error("DATABASE_URL es obligatoria en el ambiente development");
    }
    const url = parseDatabaseUrl(values.DATABASE_URL, "DATABASE_URL");
    if (
      ["127.0.0.1", "localhost"].includes(url.hostname) &&
      (["55432", "55433"].includes(url.port) || url.pathname === "/hotel_test_db")
    ) {
      throw new Error(
        "Configuración contradictoria: En NODE_ENV=development, DATABASE_URL apunta a la base de pruebas (hotel_test_db / puerto 55432). " +
        "Para desarrollo habitual debe conectarse a hotel_db en puerto 5432. " +
        "Si desea iniciar el servidor contra la base de pruebas para comprobaciones manuales, ejecute 'npm run dev:test'.",
      );
    }
  } else if (!values.DATABASE_URL) {
    throw new Error(`DATABASE_URL es obligatoria en el ambiente ${values.NODE_ENV}`);
  } else {
    parseDatabaseUrl(values.DATABASE_URL, "DATABASE_URL");
  }
};

const parseDatabaseUrl = (value: string, field: string) => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${field} debe ser una URL PostgreSQL válida`);
  }
  if (url.protocol !== "postgres:" && url.protocol !== "postgresql:") {
    throw new Error(`${field} debe utilizar el protocolo postgres:// o postgresql://`);
  }
  return url;
};

const validateStripe = (values: Env) => {
  if (values.STRIPE_ENABLED && (!values.STRIPE_SECRET_KEY || !values.STRIPE_WEBHOOK_SECRET)) {
    throw new Error(
      "STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET son obligatorias cuando STRIPE_ENABLED=true",
    );
  }
  if (values.STRIPE_SECRET_KEY && !/^sk_(test|live)_/.test(values.STRIPE_SECRET_KEY)) {
    throw new Error("STRIPE_SECRET_KEY debe comenzar con sk_test_ o sk_live_");
  }
  if (values.STRIPE_WEBHOOK_SECRET && !values.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY es obligatoria cuando se configura STRIPE_WEBHOOK_SECRET");
  }
  if (values.STRIPE_SECRET_KEY && !values.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET es obligatoria cuando se configura STRIPE_SECRET_KEY");
  }
};

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): Env => {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(`Configuración inválida: ${formatIssues(result.error.issues)}`);
  }

  validateDatabase(result.data);
  validateStripe(result.data);
  if (result.data.GOOGLE_LOGIN_ENABLED && !result.data.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID es obligatoria cuando GOOGLE_LOGIN_ENABLED=true");
  }
  return result.data;
};

export const env = loadEnv();
