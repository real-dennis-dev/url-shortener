const dotenv = require("dotenv");
dotenv.config();
const app = require("./app.js");

const PORT = process.env.PORT || 3000;

// ========================================
// Server
// ========================================

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ========================================
// Process-level Error Handling
// ========================================

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:", error);

  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);

  server.close(() => {
    process.exit(1);
  });
});

// ========================================
// Graceful Shutdown
// ========================================

const shutdown = (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log("HTTP server closed");

    // Close database connections here
    // Close Redis connections here
    // Close message broker connections here
    // etc.

    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
