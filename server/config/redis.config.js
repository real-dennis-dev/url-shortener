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
