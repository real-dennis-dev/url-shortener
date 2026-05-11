import express from "express";
import { AdminController } from "../controllers/admin.js";
import { auth } from "../middleware/auth.js";
import {
  validationMiddleware,
  validateQuery,
} from "../middleware/validation.js";
import {
  adminUrlFilterSchema,
  moderationSchema,
  adminUserUpdateSchema,
  adminAnalyticsSchema,
  adminExportSchema,
  resolveAbuseReportSchema,
} from "../validators/schemas.js";

const router = express.Router();

// ==================== Authentication & Authorization ====================
router.use(auth);
router.use(AdminController.isAdmin);

// ==================== URL Management ====================
router.get(
  "/urls",
  validateQuery(adminUrlFilterSchema),
  AdminController.getAllUrls
);

router.get("/urls/:shortCode", AdminController.getUrlDetails);

router.post(
  "/urls/:shortCode/moderate",
  validationMiddleware(moderationSchema),
  AdminController.moderateAbusiveLink
);

router.patch("/urls/:shortCode", AdminController.updateUrl);
router.delete("/urls/:shortCode", AdminController.deleteUrl);

// ==================== User Management ====================
router.get("/users", AdminController.getAllUsers);
router.get("/users/:userId", AdminController.getUserDetails);

router.patch(
  "/users/:userId",
  validationMiddleware(adminUserUpdateSchema),
  AdminController.updateUser
);

router.delete("/users/:userId", AdminController.deleteUser);
router.post("/users/:userId/suspend", AdminController.suspendUser);
router.post("/users/:userId/unsuspend", AdminController.unsuspendUser);

// ==================== Analytics & Reports ====================
router.get(
  "/analytics/global",
  validateQuery(adminAnalyticsSchema),
  AdminController.getGlobalAnalytics
);

router.get("/analytics/realtime", AdminController.getRealtimeAnalytics);
router.get("/reports/daily", AdminController.getDailyReport);
router.get("/reports/weekly", AdminController.getWeeklyReport);
router.get("/reports/monthly", AdminController.getMonthlyReport);

// ==================== Abuse Management ====================
router.get("/abuse-reports", AdminController.getAbuseReports);
router.get("/abuse-reports/:reportId", AdminController.getAbuseReportDetails);

router.patch(
  "/abuse-reports/:reportId/resolve",
  validationMiddleware(resolveAbuseReportSchema),
  AdminController.resolveAbuseReport
);

router.post(
  "/abuse-reports/:reportId/escalate",
  AdminController.escalateAbuseReport
);

// ==================== System Management ====================
router.get("/system/health", AdminController.getSystemHealth);
router.get("/system/metrics", AdminController.getSystemMetrics);
router.get("/system/logs", AdminController.getSystemLogs);

router.get(
  "/export",
  validateQuery(adminExportSchema),
  AdminController.exportData
);

router.post("/system/cache/clear", AdminController.clearCache);
router.post("/system/maintenance", AdminController.toggleMaintenanceMode);

// ==================== Settings Management ====================
router.get("/settings", AdminController.getSettings);
router.patch("/settings", AdminController.updateSettings);
router.get("/settings/backup", AdminController.getBackupSettings);
router.post("/settings/backup/trigger", AdminController.triggerBackup);

export default router;
