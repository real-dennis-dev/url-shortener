// src/modules/urls/routes/url.routes.js
const express = require("express");
const router = express.Router();

// Import middleware
const globalMiddleware = require("../../../middleware/global.middleware");
const urlMiddleware = require("../middleware/url.middleware");
const authMiddleware = require("../../auth/middleware/auth.middleware");

// Import controller
const UrlController = require("../controllers/url.controller");
const UrlService = require("../services/url.service");

// Initialize services and controller
const urlService = new UrlService(
  globalMiddleware.dbService,
  globalMiddleware.cacheService,
  globalMiddleware.queueService
);
const urlController = new UrlController(urlService);

// Public routes (no authentication required)
router.get(
  "/:shortCode",
  urlMiddleware.validateShortCode,
  urlMiddleware.checkUrlExpiration,
  urlMiddleware.checkUrlPassword,
  urlController.redirectToUrl
);

// Protected routes (authentication required)
router.use(authMiddleware.authenticate);

// Get all URLs for user
router.get("/", urlMiddleware.validateGetUrlsQuery, urlController.getUserUrls);

// Create short URL
router.post(
  "/",
  urlMiddleware.urlCreationLimiter,
  urlMiddleware.validateUrlCreation,
  urlController.createShortUrl
);

// Bulk create URLs
router.post(
  "/bulk",
  urlMiddleware.validateBulkUpload,
  urlController.bulkCreateUrls
);

// Get URLs by tag
router.get("/tags/:tag", urlController.getUrlsByTag);

// URL operations (with ID)
router.use("/:id", urlMiddleware.validateUrlId);

// Get URL details
router.get(
  "/:id",
  urlMiddleware.checkUrlOwnership,
  urlController.getUrlDetails
);

// Update URL
router.put(
  "/:id",
  urlMiddleware.checkUrlOwnership,
  urlMiddleware.validateUpdateRequest,
  urlController.updateUrl
);

// Delete URL
router.delete("/:id", urlMiddleware.checkUrlOwnership, urlController.deleteUrl);

// Get URL analytics
router.get(
  "/:id/analytics",
  urlMiddleware.checkUrlOwnership,
  urlController.getUrlAnalytics
);

// Get URL statistics
router.get(
  "/:id/stats",
  urlMiddleware.checkUrlOwnership,
  urlController.getUrlStats
);

// Set URL password
router.post(
  "/:id/password",
  urlMiddleware.checkUrlOwnership,
  urlMiddleware.validatePasswordRequest,
  urlController.setUrlPassword
);

// Remove URL password
router.delete(
  "/:id/password",
  urlMiddleware.checkUrlOwnership,
  urlController.removeUrlPassword
);

// Set URL expiration
router.put(
  "/:id/expire",
  urlMiddleware.checkUrlOwnership,
  urlMiddleware.validateExpirationRequest,
  urlController.setUrlExpiration
);

module.exports = router;
