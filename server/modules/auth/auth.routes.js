// auth.routes.js
const express = require("express");
const AuthController = require("./auth.controller.js");
const SessionController = require("./session.controller.js");
const authMiddleware = require("./auth.middleware.js");
const authValidation = require("./auth.validator.js");
const { validateRequest } = require("../../middleware/global.middleware.js");

const router = express.Router();
const authController = new AuthController();
const sessionController = new SessionController();

// ============ Public Routes ============

// Register
router.post(
  "/register",
  validateRequest(authValidation.register),
  authController.register
);

// Login
router.post(
  "/login",
  validateRequest(authValidation.login),
  authController.login
);

// Verify email
router.get(
  "/verify-email/:token",
  validateRequest(authValidation.verifyEmail),
  authController.verifyEmail
);

// Request password reset
router.post(
  "/reset-password",
  validateRequest(authValidation.resetPasswordRequest),
  authController.requestPasswordReset
);

// Reset password
router.post(
  "/reset-password/:token",
  validateRequest(authValidation.resetPassword),
  authController.resetPassword
);

// Refresh token
router.post(
  "/refresh",
  validateRequest(authValidation.refreshToken),
  authController.refresh
);

// ============ Protected Routes ============

// Apply authentication middleware
router.use(authMiddleware.authenticate);

// Current user
router.get("/me", authController.getCurrentUser);

// Logout
router.post("/logout", authController.logout);

// Change password
router.put(
  "/change-password",
  validateRequest(authValidation.changePassword),
  authController.changePassword
);

// Regenerate API key
router.post("/api-key/regenerate", authController.regenerateApiKey);

// ============ Session Routes ============

// Get all sessions
router.get("/sessions", sessionController.getSessions);

// Get session stats
router.get("/sessions/stats", sessionController.getSessionStats);

// Get current session
router.get("/sessions/current", sessionController.getCurrentSession);

// Revoke specific session
router.delete("/sessions/:sessionToken", sessionController.revokeSession);

// Revoke all sessions
router.delete("/sessions/all", sessionController.revokeAllSessions);

module.exports = router;
