import { RequestHandler } from "express";

import { AppError } from "../utils/AppError";

interface RateLimitOptions {
  max: number;
  windowMs: number;
  now?: () => number;
}

interface RateLimitEntry {
  count: number;
  expiresAt: number;
}

interface RateLimiter {
  middleware: RequestHandler;
  reset: () => void;
}

export const createRateLimiter = ({
  max,
  windowMs,
  now = Date.now,
}: RateLimitOptions): RateLimiter => {
  const entries = new Map<string | undefined, RateLimitEntry>();
  let nextCleanupAt = 0;

  const middleware: RequestHandler = (req, _res, next) => {
    const currentTime = now();

    if (currentTime >= nextCleanupAt) {
      for (const [key, entry] of entries) {
        if (currentTime >= entry.expiresAt) {
          entries.delete(key);
        }
      }

      nextCleanupAt = currentTime + windowMs;
    }

    const key = req.ip;
    const entry = entries.get(key);

    if (!entry || currentTime >= entry.expiresAt) {
      entries.set(key, {
        count: 1,
        expiresAt: currentTime + windowMs,
      });
      return next();
    }

    if (entry.count >= max) {
      return next(
        new AppError(
          429,
          "TOO_MANY_REQUESTS",
          "Demasiadas solicitudes. Intente nuevamente más tarde",
        ),
      );
    }

    entry.count += 1;
    next();
  };

  return {
    middleware,
    reset: () => {
      entries.clear();
      nextCleanupAt = 0;
    },
  };
};
