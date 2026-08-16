// src/config/database.config.js
require("dotenv").config();

module.exports = {
  development: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "url_shortener_dev",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    poolSize: 20,
    ssl: false,
    logging: true,
  },
  test: {
    host: process.env.TEST_DB_HOST || "localhost",
    port: parseInt(process.env.TEST_DB_PORT) || 5432,
    database: process.env.TEST_DB_NAME || "url_shortener_test",
    user: process.env.TEST_DB_USER || "postgres",
    password: process.env.TEST_DB_PASSWORD || "postgres",
    poolSize: 10,
    ssl: false,
    logging: false,
  },
  staging: {
    host: process.env.STAGING_DB_HOST,
    port: parseInt(process.env.STAGING_DB_PORT) || 5432,
    database: process.env.STAGING_DB_NAME,
    user: process.env.STAGING_DB_USER,
    password: process.env.STAGING_DB_PASSWORD,
    poolSize: 30,
    ssl: true,
    logging: false,
  },
  production: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    poolSize: 50,
    ssl: {
      rejectUnauthorized: false,
    },
    logging: false,
  },
};

// src/config/redis.config.js
require("dotenv").config();

module.exports = {
  development: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    ttl: {
      url: 3600,
      analytics: 300,
      user: 1800,
      config: 86400,
      session: 86400,
      rateLimit: 60,
    },
  },
  test: {
    host: process.env.TEST_REDIS_HOST || "localhost",
    port: parseInt(process.env.TEST_REDIS_PORT) || 6379,
    password: process.env.TEST_REDIS_PASSWORD || undefined,
    db: parseInt(process.env.TEST_REDIS_DB) || 1,
    ttl: {
      url: 60,
      analytics: 30,
      user: 60,
      config: 60,
      session: 60,
      rateLimit: 10,
    },
  },
  production: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
    ttl: {
      url: 3600,
      analytics: 300,
      user: 1800,
      config: 86400,
      session: 86400,
      rateLimit: 60,
    },
  },
};

// src/config/jwt.config.js
require("dotenv").config();

module.exports = {
  accessTokenSecret:
    process.env.JWT_ACCESS_SECRET ||
    "your-access-secret-key-change-in-production",
  refreshTokenSecret:
    process.env.JWT_REFRESH_SECRET ||
    "your-refresh-secret-key-change-in-production",
  accessTokenExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  refreshTokenExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  algorithm: "HS256",
  issuer: process.env.JWT_ISSUER || "url-shortener",
  audience: process.env.JWT_AUDIENCE || "url-shortener-api",
};

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

// src/config/email.config.js
require("dotenv").config();

module.exports = {
  development: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    user: process.env.SMTP_USER || "test@example.com",
    password: process.env.SMTP_PASSWORD || "testpassword",
    fromEmail: process.env.FROM_EMAIL || "test@example.com",
    fromName: process.env.FROM_NAME || "URL Shortener Dev",
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
  },
  test: {
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    user: "test@ethereal.email",
    password: "testpassword",
    fromEmail: "test@ethereal.email",
    fromName: "URL Shortener Test",
    baseUrl: "http://localhost:3000",
  },
  production: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromEmail: process.env.FROM_EMAIL,
    fromName: process.env.FROM_NAME || "URL Shortener",
    baseUrl: process.env.BASE_URL,
  },
};

// src/config/upload.config.js
require("dotenv").config();

module.exports = {
  provider: process.env.STORAGE_PROVIDER || "local", // 'local' or 's3'
  bucket: process.env.S3_BUCKET || "uploads",
  region: process.env.S3_REGION || "us-east-1",
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  endpoint: process.env.S3_ENDPOINT || undefined,
  storagePath: process.env.STORAGE_PATH || "./uploads",
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  image: {
    maxWidth: 2000,
    maxHeight: 2000,
    quality: 80,
    formats: ["jpeg", "png", "webp"],
  },
};
