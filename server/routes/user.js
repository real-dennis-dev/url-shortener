// routes/user.routes.js
import express from "express";
import { UserController } from "../controllers/user.js";
import { auth } from "../middleware/auth.js";
import { validationMiddleware } from "../middleware/validation.js";
import {
  userUpdateSchema,
  changePasswordSchema,
  //updatePreferencesSchema,
} from "../validators/schemas.js";

const router = express.Router();

// All user routes require authentication
router.use(auth);

// Get user profile
router.get("/profile", UserController.getProfile);

// Update user profile
router.patch(
  "/profile",
  validationMiddleware(userUpdateSchema),
  UserController.updateProfile
);

// Update user preferences
// router.patch(
//   "/preferences",
//   validationMiddleware(updatePreferencesSchema),
//   UserController.updatePreferences
// );

// Change password
router.post(
  "/change-password",
  validationMiddleware(changePasswordSchema),
  UserController.changePassword
);

// Get user statistics
router.get("/stats", UserController.getUserStats);

// Regenerate API key
router.post("/regenerate-api-key", UserController.regenerateApiKey);

// Get user activity log
// router.get("/activity", UserController.getActivityLog);

// Delete user account
router.delete("/account", UserController.deleteAccount);

// Get user's URL tags
// router.get("/tags", UserController.getUserTags);

// Mark notification as read
router.patch(
  "/notifications/:notificationId",
  UserController.markNotificationRead
);

router.get("/api-key", UserController.getApiKey);
router.delete("/api-key", UserController.revokeApiKey);
// router.post("/avatar", upload.single("avatar"), UserController.uploadAvatar); // if using multer
router.get("/notifications", UserController.getNotifications);
router.patch(
  "/notifications/:notificationId/read",
  UserController.markNotificationRead
);

export default router;
