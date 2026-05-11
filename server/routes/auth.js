// routes/auth.routes.js (updated)
import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  me,
  logout,
  logoutAllDevices,
  refreshToken,
} from "../controllers/auth.js";
import { validationMiddleware } from "../middleware/validation.js";
import { auth } from "../middleware/auth.js";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validators/schemas.js";

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true,
});

// Public auth routes
router.post(
  "/register",
  authLimiter,
  validationMiddleware(registerSchema),
  register
);

router.post("/login", authLimiter, validationMiddleware(loginSchema), login);

router.post(
  "/forgot-password",
  authLimiter,
  validationMiddleware(forgotPasswordSchema),
  forgotPassword
);

router.post(
  "/reset-password/:token",
  authLimiter,
  validationMiddleware(resetPasswordSchema),
  resetPassword
);

router.get("/verify-email/:token", verifyEmail);

// Protected auth routes
router.post("/logout", auth, logout);
router.post("/logout-all", auth, logoutAllDevices);
router.post("/refresh-token", refreshToken);
router.post("/resend-verification", auth, resendVerification);
router.get("/me", me);

export default router;
