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
