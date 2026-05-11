// routes/url.routes.js
import express from "express";
import { UrlController } from "../controllers/urls.js";
import { auth } from "../middleware/auth.js";
import { validationMiddleware } from "../middleware/validation.js";
import {
  createUrlSchema,
  updateUrlSchema,
  paginationSchema,
  bulkArchiveSchema,
  bulkDeleteSchema,
  bulkTagsSchema,
} from "../validators/schemas.js";

const router = express.Router();

// All URL routes require authentication
router.use(auth);

// Create short URL
router.post(
  "/shorten",
  validationMiddleware(createUrlSchema),
  UrlController.createShortUrl
);

// List user's URLs with pagination
router.get(
  "/my-urls",
  validationMiddleware(paginationSchema, "query"),
  UrlController.listUserUrls
);

// Get single URL details
router.get("/:shortCode/details", UrlController.getUrlDetails);

// Update URL metadata
router.patch(
  "/:shortCode/metadata",
  validationMiddleware(updateUrlSchema),
  UrlController.updateUrlMetadata
);

// Toggle URL active status
router.patch("/:shortCode/toggle-status", UrlController.toggleUrlStatus);

// Delete URL
router.delete("/:shortCode", UrlController.deleteUrl);

// Bulk operations
router.post(
  "/bulk/archive",
  validationMiddleware(bulkArchiveSchema),
  UrlController.bulkArchive
);
router.post(
  "/bulk/delete",
  validationMiddleware(bulkDeleteSchema),
  UrlController.bulkDelete
);
router.post(
  "/bulk/update-tags",
  validationMiddleware(bulkTagsSchema),
  UrlController.bulkUpdateTags
);

export default router;
