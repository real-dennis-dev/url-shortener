// src/modules/users/routes.js
const express = require("express");
const router = express.Router();

const UserController = require("./controller");
const userMiddleware = require("./middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { validatePagination } = require("../../middleware/global.middleware");

const controller = new UserController();

// All routes require authentication
router.use(authenticate);

// ============================
// Profile Routes
// ============================

// Get user profile
router.get("/profile", controller.getProfile);

// Update user profile
router.put(
  "/profile",
  userMiddleware.validateProfileUpdate,
  controller.updateProfile
);

// ============================
// API Key Routes
// ============================

// Regenerate API key
router.post("/api-key", controller.regenerateApiKey);

// ============================
// Password Routes
// ============================

// Change password
router.put(
  "/password",
  userMiddleware.validatePasswordChange,
  controller.changePassword
);

// ============================
// Preferences Routes
// ============================

// Get preferences
router.get("/preferences", controller.getPreferences);

// Update preferences
router.put(
  "/preferences",
  userMiddleware.validatePreferenceUpdate,
  controller.updatePreferences
);

// ============================
// Plan Routes
// ============================

// Update plan (Admin only)
router.put("/plan", userMiddleware.validatePlanUpdate, controller.updatePlan);

// ============================
// Stats Routes
// ============================

// Get user stats
router.get("/stats", controller.getStats);

// ============================
// Activity Routes
// ============================

// Get user activity
router.get("/activity", validatePagination, controller.getActivity);

// ============================
// Account Management Routes
// ============================

// Delete account
router.delete(
  "/delete",
  userMiddleware.validateAccountDeletion,
  controller.deleteAccount
);

// ============================
// Admin Routes
// ============================

// Get all users (Admin only)
router.get(
  "/",
  userMiddleware.checkUserAccess,
  validatePagination,
  controller.getAllUsers
);

module.exports = router;
