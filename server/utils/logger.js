// utils/logger.js - Extended version
import winston from "winston";
import { randomUUID } from "crypto";
import fs from "fs";

const logsDir = "logs";
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create service-specific logger
export const createServiceLogger = (serviceName, logFileName) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: baseFormat,
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({
        filename: `logs/${logFileName}.log`,
        maxsize: 5242880,
        maxFiles: 5,
      }),
      new winston.transports.File({ filename: "logs/combined.log" }),
    ],
    defaultMeta: { service: serviceName },
  });
};

// Category-specific loggers
export const businessLogger = createServiceLogger(
  "business",
  "business-events"
);
export const requestLogger = createServiceLogger("request", "requests");
export const performanceLogger = createServiceLogger(
  "performance",
  "performance"
);
export const integrationLogger = createServiceLogger(
  "integration",
  "integrations"
);
export const errorLogger = createServiceLogger("error", "errors");
export const securityLogger = createServiceLogger(
  "security",
  "security-events"
);

// Context-aware logger for requests
export const createRequestContextLogger = (req, context = {}) => {
  const requestId = req.requestId || randomUUID();
  const baseContext = {
    requestId,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    userAgent: req.get("user-agent"),
    ...context,
  };

  return {
    business: (action, data) =>
      businessLogger.info(action, { ...baseContext, ...data }),
    request: (message, data) =>
      requestLogger.info(message, { ...baseContext, ...data }),
    performance: (operation, duration, data) =>
      performanceLogger.info(operation, {
        ...baseContext,
        durationMs: duration,
        ...data,
      }),
    integration: (service, action, data) =>
      integrationLogger.info(`${service}:${action}`, {
        ...baseContext,
        externalService: service,
        ...data,
      }),
    error: (error, data) =>
      errorLogger.error(error.message || error, {
        ...baseContext,
        stack: error.stack,
        ...data,
      }),
    security: (event, data) =>
      securityLogger.warn(event, { ...baseContext, ...data }),
  };
};
