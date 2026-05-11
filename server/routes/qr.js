// routes/qr.routes.js
import express from "express";
import { QRController } from "../controllers/qr.js";
import { auth } from "../middleware/auth.js";
import { validateQuery } from "../middleware/validation.js";
import {
  qrSchema,
  styledQRCodeSchema,
  bulkQRCodeSchema,
} from "../validators/schemas.js";

const router = express.Router();

// QR routes support both JWT and API key authentication
router.use(auth);

// Generate & Download QR
router.get(
  "/:shortCode/generate",
  validateQuery(qrSchema),
  QRController.generateQRCode
);
router.get(
  "/:shortCode/download",
  validateQuery(qrSchema),
  QRController.downloadQRCode
);

// Styled QR
router.post(
  "/:shortCode/styled",
  validateQuery(styledQRCodeSchema), // <-- new middleware
  QRController.generateStyledQRCode
);

// Get QR statistics
router.get("/:shortCode/stats", QRController.getQRStats);

// Bulk QR generation
router.post(
  "/bulk-generate",
  validateQuery(bulkQRCodeSchema),
  QRController.bulkGenerateQR
);
// Get QR code with embed logo
// router.post("/:shortCode/with-logo", QRController.generateQRWithLogo);

export default router;
