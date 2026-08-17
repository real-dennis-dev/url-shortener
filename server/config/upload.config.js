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
