import { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { logger, normalizeRequestPath } from "../utils/logger";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestLoggingMiddleware: RequestHandler = (req, res, next) => {
  const requestId = randomUUID();
  const startedAt = process.hrtime.bigint();
  req.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    logger[level]("http.request", {
      requestId,
      method: req.method,
      route: normalizeRequestPath(req.originalUrl),
      statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  next();
};
