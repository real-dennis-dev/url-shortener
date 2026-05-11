// utils/performanceMonitor.js
import { performanceLogger } from "./logger.js";

export class PerformanceMonitor {
  static measureDatabaseQuery(queryName, operation) {
    const start = process.hrtime();
    return async (...args) => {
      try {
        const result = await operation(...args);
        const duration = process.hrtime(start);
        const durationMs = duration[0] * 1000 + duration[1] / 1000000;

        performanceLogger.info("DATABASE_QUERY", {
          queryName,
          durationMs,
          success: true,
          metadata: { args: JSON.stringify(args).slice(0, 200) },
        });

        return result;
      } catch (error) {
        const duration = process.hrtime(start);
        const durationMs = duration[0] * 1000 + duration[1] / 1000000;

        performanceLogger.error("DATABASE_QUERY_FAILED", {
          queryName,
          durationMs,
          error: error.message,
          success: false,
        });
        throw error;
      }
    };
  }

  static trackApiCall(service, endpoint) {
    return (target, propertyName, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args) {
        const start = process.hrtime();
        const result = await originalMethod.apply(this, args);
        const duration = process.hrtime(start);
        const durationMs = duration[0] * 1000 + duration[1] / 1000000;

        performanceLogger.info("API_CALL", {
          service,
          endpoint,
          durationMs,
          timestamp: new Date().toISOString(),
        });

        return result;
      };

      return descriptor;
    };
  }

  static trackMemoryUsage() {
    const used = process.memoryUsage();
    performanceLogger.info("MEMORY_USAGE", {
      heapUsed: Math.round((used.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotal: Math.round((used.heapTotal / 1024 / 1024) * 100) / 100,
      external: Math.round((used.external / 1024 / 1024) * 100) / 100,
      rss: Math.round((used.rss / 1024 / 1024) * 100) / 100,
    });
  }
}

// Usage in controllers
class UserController {
  @PerformanceMonitor.trackApiCall("user-service", "getUserById")
  async getUserById(req, res) {
    // Method implementation
  }
}
