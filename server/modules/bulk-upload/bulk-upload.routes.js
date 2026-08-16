const express = require("express");
const router = express.Router();
const BulkUploadController = require("./bulk-upload.controller");
const bulkUploadMiddleware = require("./bulk-upload.middleware");
const { authenticate } = require("../../middleware/auth.middleware");

// All routes require authentication
router.use(authenticate);

// Upload bulk URLs
router.post(
  "/",
  bulkUploadMiddleware.uploadFile,
  bulkUploadMiddleware.validateFile,
  bulkUploadMiddleware.processBulkFile,
  bulkUploadMiddleware.validateBulkData,
  bulkUploadMiddleware.bulkUploadLimiter,
  BulkUploadController.uploadBulkUrls
);

// Get bulk upload status
router.get(
  "/:id",
  bulkUploadMiddleware.validateBulkUploadId,
  bulkUploadMiddleware.checkOwnership,
  BulkUploadController.getBulkUploadStatus
);

// Get all bulk uploads
router.get(
  "/",
  bulkUploadMiddleware.validatePagination,
  bulkUploadMiddleware.validateStatusFilter,
  BulkUploadController.getAllBulkUploads
);

// Cancel bulk upload
router.post(
  "/:id/cancel",
  bulkUploadMiddleware.validateBulkUploadId,
  bulkUploadMiddleware.checkOwnership,
  BulkUploadController.cancelBulkUpload
);

// Download template
router.get("/template/download", BulkUploadController.downloadTemplate);

// Get upload statistics
router.get("/stats/overview", BulkUploadController.getUploadStats);

module.exports = router;
