const multer = require("multer");
const path = require("path");
const bulkUploadUtils = require("./bulk-upload.utils");
const { AppError } = require("../../utils/error.utils");

// Configure multer for file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        400,
        "Invalid file type. Only CSV and Excel files are allowed"
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const bulkUploadMiddleware = {
  /**
   * Upload file handler
   */
  uploadFile: upload.single("file"),

  /**
   * Validate file upload
   */
  validateFile: (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError(400, "No file uploaded");
      }

      const fileSize = req.file.size;
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (fileSize > maxSize) {
        throw new AppError(400, "File size exceeds 10MB limit");
      }

      // Validate file extension
      const ext = path.extname(req.file.originalname).toLowerCase();
      const allowedExtensions = [".csv", ".xlsx", ".xls"];

      if (!allowedExtensions.includes(ext)) {
        throw new AppError(
          400,
          "Invalid file extension. Allowed: .csv, .xlsx, .xls"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Process CSV/Excel file
   */
  processBulkFile: async (req, res, next) => {
    try {
      if (!req.file) {
        next();
        return;
      }

      const fileBuffer = req.file.buffer;
      const fileType = req.file.mimetype;
      let parsedData = [];

      try {
        if (fileType === "text/csv") {
          parsedData = await bulkUploadUtils.parseCSV(
            fileBuffer.toString("utf-8")
          );
        } else if (
          fileType === "application/vnd.ms-excel" ||
          fileType ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ) {
          parsedData = await bulkUploadUtils.parseExcel(fileBuffer);
        } else {
          throw new AppError(400, "Unsupported file format");
        }
      } catch (error) {
        throw new AppError(400, `Failed to parse file: ${error.message}`);
      }

      // Store parsed data in request
      req.parsedData = parsedData;
      next();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validate bulk data
   */
  validateBulkData: (req, res, next) => {
    try {
      if (!req.parsedData || req.parsedData.length === 0) {
        throw new AppError(400, "No data found in file");
      }

      // Check if data has required fields
      const requiredFields = ["url"];
      const hasInvalidRows = req.parsedData.some((row) => {
        return requiredFields.some((field) => !row[field]);
      });

      if (hasInvalidRows) {
        throw new AppError(400, "Missing required field: url");
      }

      // Validate maximum rows
      const maxRows = 10000;
      if (req.parsedData.length > maxRows) {
        throw new AppError(400, `Maximum ${maxRows} rows allowed`);
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Rate limiting for bulk uploads
   */
  bulkUploadLimiter: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userPlan = req.user.plan;

      // Define limits based on plan
      const limits = {
        free: { uploads: 5, interval: 86400 }, // 5 per day
        pro: { uploads: 50, interval: 86400 }, // 50 per day
        business: { uploads: 200, interval: 86400 }, // 200 per day
        enterprise: { uploads: 1000, interval: 86400 }, // 1000 per day
      };

      const limit = limits[userPlan] || limits.free;
      const cacheKey = `bulk-upload-limit:${userId}:${Math.floor(
        Date.now() / (limit.interval * 1000)
      )}`;

      // Get current count
      const cacheService = req.cacheService;
      let count = await cacheService.get(cacheKey);

      if (!count) {
        count = 0;
      }

      if (count >= limit.uploads) {
        throw new AppError(
          429,
          `Bulk upload limit exceeded. Maximum ${limit.uploads} uploads per ${
            limit.interval / 3600
          } hours`
        );
      }

      // Increment count
      await cacheService.set(cacheKey, count + 1, limit.interval);

      next();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validate bulk upload ID
   */
  validateBulkUploadId: (req, res, next) => {
    const { id } = req.params;

    if (
      !id ||
      !id.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    ) {
      throw new AppError(400, "Invalid bulk upload ID format");
    }

    next();
  },

  /**
   * Check bulk upload ownership
   */
  checkOwnership: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const dbService = req.dbService;
      const query = `SELECT user_id FROM public.bulk_uploads WHERE id = $1`;
      const result = await dbService.executeQuery(query, [id]);

      if (result.rows.length === 0) {
        throw new AppError(404, "Bulk upload not found");
      }

      if (result.rows[0].user_id !== userId) {
        throw new AppError(
          403,
          "Access denied. You do not own this bulk upload"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validate status filter
   */
  validateStatusFilter: (req, res, next) => {
    const { status } = req.query;

    if (status) {
      const allowedStatus = [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
      ];
      if (!allowedStatus.includes(status)) {
        throw new AppError(
          400,
          "Invalid status filter. Allowed: pending, processing, completed, failed, cancelled"
        );
      }
    }

    next();
  },

  /**
   * Validate pagination
   */
  validatePagination: (req, res, next) => {
    const { page, limit } = req.query;

    if (page && (isNaN(page) || parseInt(page) < 1)) {
      throw new AppError(400, "Invalid page parameter");
    }

    if (
      limit &&
      (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)
    ) {
      throw new AppError(
        400,
        "Invalid limit parameter. Must be between 1 and 100"
      );
    }

    next();
  },
};

module.exports = bulkUploadMiddleware;
