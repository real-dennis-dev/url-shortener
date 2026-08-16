const express = require("express");
const cookieParser = require("cookie-parser");

// Modules
// const urlModule = require ("./modules/url/index.js");
const authModule = require("./modules/auth/auth.routes.js");

// Global middleware
const globalMiddleware = require("./middleware/global.middleware.js");

const app = express();

// ================================
// Security & Global Middleware
// ================================

// Parse cookies
app.use(cookieParser());

// --- Early / request setup ---
app.use(globalMiddleware.requestIdGenerator); // req.id + X-Request-ID
app.use(globalMiddleware.extractIpAddress); // req.ip
app.use(globalMiddleware.parseUserAgent); // req.userAgent
app.use(globalMiddleware.responseTimeTracker); // X-Response-Time (on finish)

// --- Security & CORS ---
app.use(globalMiddleware.securityHeaders); // helmet
app.use(globalMiddleware.corsHandler); // cors

// --- Logging & compression ---
app.use(globalMiddleware.requestLogger);
app.use(globalMiddleware.compressionHandler);

// --- Body size limit (before body parsers) ---
app.use(globalMiddleware.requestSizeLimiter("10mb"));

// --- Body parsers (after size check) ---
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ================================
// Routes
// ================================

// app.use("/api/v1/urls", urlModule);
app.use("/api/v1/auth", authModule);

// ================================
// 404 Handler
// ================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ================================
// Global Error Handler
// ================================

app.use(globalMiddleware.errorHandler);

module.exports = app;
