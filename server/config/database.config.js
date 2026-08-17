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
