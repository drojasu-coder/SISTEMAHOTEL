import cors, { CorsOptions } from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./env";
import { AppError } from "../utils/AppError";

const defaultDevelopmentOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
];

export const allowedCorsOrigins = (env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (env.NODE_ENV === "production" && allowedCorsOrigins.length === 0) {
  throw new Error("CORS_ORIGINS es obligatoria en producción");
}

export const configuredOrigins =
  allowedCorsOrigins.length > 0
    ? allowedCorsOrigins
    : env.NODE_ENV === "production"
      ? []
      : defaultDevelopmentOrigins;

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || configuredOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(
      new AppError(
        403,
        "CORS_ORIGIN_DENIED",
        "El origen de la solicitud no está permitido",
      ),
    );
  },
  credentials: false,
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "Stripe-Signature", "X-Google-CSRF"],
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);

export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  hsts: env.NODE_ENV === "production",
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: "no-referrer" },
});

export const authenticationRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (_request, _response, next) => {
    next(
      new AppError(
        429,
        "RATE_LIMIT_EXCEEDED",
        "Demasiadas solicitudes. Inténtelo nuevamente más tarde",
      ),
    );
  },
});
