// src/services/file-upload.service.js
const dotenv = require("dotenv");
dotenv.config();
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const sharp = require("sharp");
const path = require("path");
const crypto = require("crypto");
const logger = require("../utils/logger.util");
const { ApiError } = require("../utils/error.util");

class FileUploadService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || "local";
    this.isAvailable = true;
    this.s3Client = null;

    try {
      // AWS S3 / S3-compatible storage
      if (this.provider === "s3") {
        const accessKeyId = process.env.STORAGE_ACCESS_KEY_ID;
        const secretAccessKey = process.env.STORAGE_SECRET_ACCESS_KEY;
        const region = process.env.STORAGE_REGION;

        if (!accessKeyId || !secretAccessKey || !region) {
          this.isAvailable = false;

          logger.warn(
            "S3 storage is not configured correctly. Storage operations will be disabled."
          );
        } else {
          this.s3Client = new S3Client({
            region,
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
            endpoint: process.env.STORAGE_ENDPOINT || undefined,
          });

          logger.info("S3 storage client initialized");
        }
      }

      // Local storage
      this.storagePath = process.env.STORAGE_PATH || "./uploads";

      // Bucket configuration
      this.bucket = process.env.STORAGE_BUCKET;

      // Public/base URL
      this.baseUrl = process.env.STORAGE_BASE_URL || process.env.BASE_URL;

      // Allowed file types
      this.allowedTypes = process.env.STORAGE_ALLOWED_TYPES
        ? process.env.STORAGE_ALLOWED_TYPES.split(",").map((type) =>
            type.trim()
          )
        : ["image/jpeg", "image/png", "image/gif", "image/webp"];

      // Maximum upload size
      this.maxSize = Number(process.env.STORAGE_MAX_SIZE) || 5 * 1024 * 1024;

      logger.info("Storage service initialized", {
        provider: this.provider,
        available: this.isAvailable,
        storagePath: this.storagePath,
        bucket: this.bucket || null,
        maxSize: this.maxSize,
      });
    } catch (error) {
      // NEVER allow storage initialization to crash the application
      this.isAvailable = false;

      logger.error("Storage service initialization failed", {
        error: error.message,
        stack: error.stack,
        provider: this.provider,
      });

      // Do not throw
    }
  }

  /**
   * Upload file
   * @param {File} file - File to upload
   * @param {string} path - Storage path
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - Upload result
   */
  async uploadFile(file, path, options = {}) {
    try {
      // Validate file
      const validation = this.validateFile(
        file,
        options.allowedTypes || this.allowedTypes,
        options.maxSize || this.maxSize
      );
      if (!validation.valid) {
        throw new ApiError(400, "INVALID_FILE", validation.errors.join(", "));
      }

      // Generate filename
      const filename = this._generateFilename(file.originalname, options);
      const fullPath = path ? `${path}/${filename}` : filename;

      // Upload based on provider
      let url;
      let key;

      if (this.config.provider === "s3") {
        const result = await this._uploadToS3(file, fullPath, options);
        url = result.url;
        key = result.key;
      } else {
        const result = await this._uploadToLocal(file, fullPath, options);
        url = result.url;
        key = result.key;
      }

      return { url, key, filename, originalName: file.originalname };
    } catch (error) {
      logger.error("File upload failed:", error);
      throw error;
    }
  }

  /**
   * Upload to S3
   * @param {File} file - File to upload
   * @param {string} key - S3 key
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - Upload result
   */
  async _uploadToS3(file, key, options = {}) {
    let fileBuffer = file.buffer;
    let contentType = file.mimetype;

    // Process image if needed
    if (options.processImage) {
      fileBuffer = await this.processImage(file, options.processImage);
      contentType = options.processImage.format || contentType;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: options.acl || "private",
      Metadata: options.metadata || {},
    });

    await this.s3Client.send(command);

    // Generate URL
    let url;
    if (options.publicRead) {
      url = `${this.baseUrl}/uploads/${key}`;
    } else {
      url = await this.getFileUrl(key, options.expiresIn || 3600);
    }

    return { url, key };
  }

  /**
   * Upload to local storage
   * @param {File} file - File to upload
   * @param {string} path - Storage path
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} - Upload result
   */
  async _uploadToLocal(file, path, options = {}) {
    const fs = require("fs").promises;
    const fullPath = this._getLocalPath(path);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    let fileBuffer = file.buffer;

    // Process image if needed
    if (options.processImage) {
      fileBuffer = await this.processImage(file, options.processImage);
    }

    // Write file
    await fs.writeFile(fullPath, fileBuffer);

    // Generate URL
    let url;
    if (options.publicRead) {
      url = `${this.baseUrl}/uploads/${path}`;
    } else {
      // For private files, we could implement signed URLs
      url = `${this.baseUrl}/uploads/${path}`;
    }

    return { url, key: path };
  }

  /**
   * Delete file
   * @param {string} key - File key
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFile(key) {
    try {
      if (this.config.provider === "s3") {
        const command = new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });
        await this.s3Client.send(command);
      } else {
        const fs = require("fs").promises;
        const fullPath = this._getLocalPath(key);
        await fs.unlink(fullPath);
      }

      return true;
    } catch (error) {
      logger.error(`Failed to delete file ${key}:`, error);
      return false;
    }
  }

  /**
   * Get file URL
   * @param {string} key - File key
   * @param {number} expiresIn - URL expiration in seconds
   * @returns {Promise<string>} - File URL
   */
  async getFileUrl(key, expiresIn = 3600) {
    try {
      if (this.config.provider === "s3") {
        const command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });
        return await getSignedUrl(this.s3Client, command, { expiresIn });
      } else {
        // For local storage, return the public URL
        return `${this.baseUrl}/uploads/${key}`;
      }
    } catch (error) {
      logger.error(`Failed to generate URL for ${key}:`, error);
      throw new ApiError(
        500,
        "URL_GENERATION_FAILED",
        "Failed to generate file URL"
      );
    }
  }

  /**
   * Validate file
   * @param {File} file - File to validate
   * @param {Array} allowedTypes - Allowed MIME types
   * @param {number} maxSize - Maximum file size in bytes
   * @returns {Object} - Validation result
   */
  validateFile(file, allowedTypes = null, maxSize = null) {
    const errors = [];
    const types = allowedTypes || this.allowedTypes;
    const size = maxSize || this.maxSize;

    // Check file exists
    if (!file) {
      errors.push("No file provided");
      return { valid: false, errors };
    }

    // Check file size
    if (file.size > size) {
      errors.push(`File size exceeds ${size / 1024 / 1024}MB limit`);
    }

    // Check file type
    if (types.length > 0 && !types.includes(file.mimetype)) {
      errors.push(`File type ${file.mimetype} not allowed`);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".pdf",
      ".doc",
      ".docx",
    ];
    if (!allowedExtensions.includes(ext)) {
      errors.push(`File extension ${ext} not allowed`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Process image
   * @param {File} file - Image file
   * @param {Object} operations - Image operations
   * @returns {Promise<Buffer>} - Processed image buffer
   */
  async processImage(file, operations) {
    try {
      let pipeline = sharp(file.buffer);

      // Resize
      if (operations.resize) {
        const { width, height, fit = "cover" } = operations.resize;
        pipeline = pipeline.resize(width, height, { fit });
      }

      // Format
      if (operations.format) {
        pipeline = pipeline.toFormat(
          operations.format,
          operations.formatOptions || {}
        );
      }

      // Quality
      if (operations.quality) {
        pipeline = pipeline.jpeg({ quality: operations.quality });
      }

      // Rotate
      if (operations.rotate) {
        pipeline = pipeline.rotate(operations.rotate);
      }

      // Blur
      if (operations.blur) {
        pipeline = pipeline.blur(operations.blur);
      }

      // Grayscale
      if (operations.grayscale) {
        pipeline = pipeline.grayscale();
      }

      return await pipeline.toBuffer();
    } catch (error) {
      logger.error("Image processing failed:", error);
      throw new ApiError(
        500,
        "IMAGE_PROCESSING_FAILED",
        "Failed to process image"
      );
    }
  }

  /**
   * Generate filename
   * @param {string} originalName - Original filename
   * @param {Object} options - Options
   * @returns {string} - Generated filename
   */
  _generateFilename(originalName, options = {}) {
    const ext = path.extname(originalName);
    const name = options.keepOriginal
      ? path.basename(originalName, ext)
      : crypto.randomBytes(16).toString("hex");

    // Sanitize name
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString("hex");

    return `${sanitizedName}-${timestamp}-${random}${ext}`;
  }

  /**
   * Get local path
   * @param {string} key - File key
   * @returns {string} - Full local path
   */
  _getLocalPath(key) {
    return path.join(this.storagePath, key);
  }

  /**
   * Check service health
   * @returns {Promise<boolean>} - Health status
   */
  async healthCheck() {
    try {
      if (this.config.provider === "s3") {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: "health-check",
            Body: "test",
          })
        );
        return true;
      } else {
        const fs = require("fs").promises;
        await fs.access(this.storagePath);
        return true;
      }
    } catch (error) {
      logger.error("File upload service health check failed:", error);
      return false;
    }
  }
}

module.exports = FileUploadService;
