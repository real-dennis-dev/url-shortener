// index.js (updated)
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import cookieParser from "cookie-parser";
import { randomUUID } from "crypto";
import { config } from "dotenv";

// Load environment variables
config();

// Import middleware
import errorHandler from "./errors/errorHandler.js";
import { requestLoggerInfo } from "./middleware/requestLoggerInfo.js";

// Import routes
import apiRoutes from "./routes/index.js";

// Import logger
import {
  createRequestContextLogger,
  requestLogger as reqLogger,
} from "./utils/logger.js";

// Initialize Express app
const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// ==================== MIDDLEWARE ====================

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

// Request logging middleware
app.use(requestLoggerInfo);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    exposedHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
    maxAge: 86400,
  })
);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ==================== HEALTH CHECK ====================
app.get("/health", (req, res) => {
  const log = createRequestContextLogger(req);
  log.request("Health check performed");

  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      cache: process.env.REDIS_URL ? "connected" : "disabled",
      storage: "connected",
    },
  });
});

// ==================== API ROUTES ====================
app.use("/api", apiRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler for undefined routes
app.use((req, res, next) => {
  const log = createRequestContextLogger(req);
  log.request(`Route not found: ${req.method} ${req.url}`);

  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Cannot ${req.method} ${req.url}`,
      statusCode: 404,
    },
  });
});

// Global error handler
app.use(errorHandler);

// ==================== SERVER INITIALIZATION ====================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const server = app.listen(PORT, () => {
  console.log(`
  🚀 Server is running!
  📡 Environment: ${NODE_ENV}
  🔗 URL: http://localhost:${PORT}
  🏥 Health check: http://localhost:${PORT}/health
  `);

  reqLogger.info("Server started", {
    port: PORT,
    environment: NODE_ENV,
    nodeVersion: process.version,
    pid: process.pid,
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  reqLogger.info(`Graceful shutdown initiated: ${signal}`);

  server.close(async (err) => {
    if (err) {
      console.error("Error during server shutdown:", err);
      reqLogger.error("Error during server shutdown", { error: err });
      process.exit(1);
    }

    console.log("HTTP server closed");
    console.log("All connections closed. Exiting...");
    reqLogger.info("Graceful shutdown completed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  reqLogger.error("Uncaught Exception", { error: error.stack });
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  reqLogger.error("Unhandled Rejection", { reason });
});

export default app;
