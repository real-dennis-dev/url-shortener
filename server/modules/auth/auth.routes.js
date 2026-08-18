// auth.routes.js
const express = require("express");
const AuthController = require("./auth.controller.js");
const SessionController = require("./session.controller.js");
const authMiddleware = require("../../middleware/auth.middleware.js");
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

// Current user
router.get(
  "/me",
  authMiddleware.optionalAuthenticate,
  authController.getCurrentUser
);

// Logout
router.post("/logout", authMiddleware.authenticate, authController.logout);

// Change password
router.put(
  "/change-password",
  authMiddleware.authenticate,
  validateRequest(authValidation.changePassword),
  authController.changePassword
);

// Regenerate API key
router.post(
  "/api-key/regenerate",
  authMiddleware.authenticate,
  authController.regenerateApiKey
);

// ============ Session Routes ============

// Get all sessions
router.get(
  "/sessions",
  authMiddleware.authenticate,
  sessionController.getSessions
);

// Get session stats
router.get(
  "/sessions/stats",
  authMiddleware.authenticate,
  sessionController.getSessionStats
);

// Get current session
router.get(
  "/sessions/current",
  authMiddleware.authenticate,
  sessionController.getCurrentSession
);

// Revoke specific session
router.delete(
  "/sessions/:sessionToken",
  authMiddleware.authenticate,
  sessionController.revokeSession
);

// Revoke all sessions
router.delete(
  "/sessions/all",
  authMiddleware.authenticate,
  sessionController.revokeAllSessions
);

module.exports = router;
