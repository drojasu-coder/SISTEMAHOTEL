import { env } from "../config/env";

export type LogLevel = "debug" | "info" | "warn" | "error";
type LogValue = Record<string, unknown>;

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const sensitiveKey = /authorization|cookie|password|secret|token|signature|api[-_]?key|client[-_]?secret|card|cvv/i;
const sensitiveText = /(authorization|cookie|password|secret|token|signature|api[-_]?key|client[-_]?secret|card|cvv)/gi;

const sanitize = (value: unknown, key = ""): unknown => {
  if (sensitiveKey.test(key)) return "[REDACTED]";
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message.replace(sensitiveText, "[REDACTED]"),
      stack: value.stack?.replace(sensitiveText, "[REDACTED]"),
    };
  }
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitize(entryValue, entryKey),
      ]),
    );
  }
  return value;
};

const normalizePath = (path: string) =>
  path
    .split("?")[0]
    .replace(/\/\d+(?=\/|$)/g, "/:id")
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}(?=\/|$)/gi, "/:id");

const write = (level: LogLevel, message: string, metadata: LogValue = {}) => {
  if (levels[level] < levels[env.LOG_LEVEL]) return;

  const safeMetadata = Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [key, sanitize(value, key)]),
  );
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: env.SERVICE_NAME,
    environment: env.NODE_ENV,
    message,
    ...safeMetadata,
  };

  if (env.LOG_FORMAT === "json") {
    (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(
      JSON.stringify(entry),
    );
    return;
  }

  const details = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(sanitize(metadata))}` : "";
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(
    `[${entry.timestamp}] ${level.toUpperCase()} ${message}${details}`,
  );
};

export const logger = {
  debug: (message: string, metadata?: LogValue) => write("debug", message, metadata),
  info: (message: string, metadata?: LogValue) => write("info", message, metadata),
  warn: (message: string, metadata?: LogValue) => write("warn", message, metadata),
  error: (message: string, metadata?: LogValue) => write("error", message, metadata),
};

export const sanitizeLogValue = sanitize;
export const normalizeRequestPath = normalizePath;
