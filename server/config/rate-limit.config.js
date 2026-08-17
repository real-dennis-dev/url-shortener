// src/config/rate-limit.config.js
module.exports = {
  anonymous: {
    windowMs: 60000, // 1 minute
    max: 10,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.ip,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests from this IP, please try again later.",
        },
      });
    },
  },
  authenticated: {
    windowMs: 60000,
    max: 100,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, please try again later.",
        },
      });
    },
  },
  premium: {
    windowMs: 60000,
    max: 1000,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.user?.id,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Premium rate limit exceeded, please try again later.",
        },
      });
    },
  },
  admin: {
    windowMs: 60000,
    max: 5000,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.user?.id,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Admin rate limit exceeded, please try again later.",
        },
      });
    },
  },
  urlCreation: {
    windowMs: 60000,
    max: 50,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "URL creation rate limit exceeded, please try again later.",
        },
      });
    },
  },
  bulkUpload: {
    windowMs: 3600000, // 1 hour
    max: 10,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.user?.id,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Bulk upload rate limit exceeded, please try again later.",
        },
      });
    },
  },
};
