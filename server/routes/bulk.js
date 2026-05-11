// routes/bulk.routes.js
import express from "express";
import { BulkUrlController } from "../controllers/bulkUrl.js";
import { auth } from "../middleware/auth.js";
import { validationMiddleware } from "../middleware/validation.js";
import { upload } from "../config/multer.js";
import { bulkCreateSchema } from "../validators/schemas.js";

const router = express.Router();

// All bulk routes require authentication
router.use(auth);

// Bulk create URLs from array
router.post(
  "/create",
  validationMiddleware(bulkCreateSchema),
  BulkUrlController.bulkCreateUrls
);

// Upload and process file
router.post("/upload", upload.single("file"), BulkUrlController.uploadFile);

// Get bulk upload history
router.get("/history", BulkUrlController.getBulkHistory);

// Get specific bulk job status
router.get("/job/:jobId", BulkUrlController.getBulkJobStatus);

// Cancel bulk job
router.post("/job/:jobId/cancel", BulkUrlController.cancelBulkJob);

// Download bulk upload template
router.get("/template/download", BulkUrlController.downloadTemplate);

// Retry failed bulk URLs
router.post("/job/:jobId/retry", BulkUrlController.retryFailedUrls);

export default router;
