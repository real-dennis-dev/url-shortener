const dotenv = require("dotenv");
dotenv.config();

const app = require("./app.js");
const DatabaseService = require("./services/database.service.js");

const PORT = Number(process.env.PORT) || 3000;

const database = new DatabaseService();

let server;

// ========================================
// Application Startup
// ========================================

const startServer = async () => {
  try {
    console.log("Starting application...");

    // ----------------------------------------
    // Database
    // ----------------------------------------

    console.log("Checking database connection...");

    const databaseHealthy = await database.healthCheck();

    if (!databaseHealthy) {
      throw new Error("Database connection failed");
    }

    console.log("Database connection verified");

    // ----------------------------------------
    // HTTP Server
    // ----------------------------------------

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Application startup failed:", error);

    // Close database pool if it was created
    try {
      await database.close();
    } catch (closeError) {
      console.error("Failed to close database connection:", closeError.message);
    }

    process.exit(1);
  }
};

// ========================================
// Process-level Error Handling
// ========================================

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Promise Rejection:", error);

  shutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);

  shutdown("UNCAUGHT_EXCEPTION");
});

// ========================================
// Graceful Shutdown
// ========================================

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  try {
    // Stop accepting new HTTP connections
    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          console.log("HTTP server closed");
          resolve();
        });
      });
    }

    // Close database pool
    await database.close();

    console.log("Application shutdown complete");

    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);

    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ========================================
// Start
// ========================================

startServer();
