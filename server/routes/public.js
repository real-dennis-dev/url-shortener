// routes/public.routes.js
import express from "express";
import { RedirectController } from "../controllers/redirect.js";
import { LinkValidationController } from "../controllers/linkValidation.js";
import { validationMiddleware } from "../middleware/validation.js";
import { validateUrlSchema } from "../validators/schemas.js";

const router = express.Router();

// Redirect endpoint
router.get("/:shortCode", RedirectController.redirect);

// URL validation (basic, no auth)
router.post(
  "/validate-url",
  validationMiddleware(validateUrlSchema),
  LinkValidationController.validateUrl
);

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

export default router;
