// routes/index.js
import express from "express";
import authRoutes from "./auth.js";
import urlRoutes from "./url.js";
import analyticsRoutes from "./analytics.js";
import qrRoutes from "./qr.js";
import userRoutes from "./user.js";
import dashboardRoutes from "./dashboard.js";
import bulkRoutes from "./bulk.js";
import adminRoutes from "./admin.js";
import publicRoutes from "./public.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/urls", urlRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/qr", qrRoutes);
router.use("/user", userRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/bulk", bulkRoutes);
router.use("/admin", adminRoutes);
router.use("/", publicRoutes);

export default router;
