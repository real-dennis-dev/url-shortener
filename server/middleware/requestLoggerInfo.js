import { requestLogger } from "../utils/logger.js";

export const requestLoggerInfo = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  requestLogger.info("Incoming request", {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId: req.user?.id,
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;

    // Log response
    requestLogger.info("Request completed", {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      userId: req.user?.id,
    });

    // Log slow requests
    if (duration > 1000) {
      requestLogger.warn("Slow request detected", {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        durationMs: duration,
      });
    }

    originalSend.call(this, data);
  };

  next();
};
