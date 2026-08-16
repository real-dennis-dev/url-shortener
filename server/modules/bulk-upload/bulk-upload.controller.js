const BulkUploadService = require("./bulk-upload.service");
const { catchAsync } = require("../../utils/error.utils");
const { sendResponse } = require("../../utils/response.utils");

class BulkUploadController {
  constructor() {
    this.bulkUploadService = new BulkUploadService();
  }

  /**
   * Upload bulk URLs
   * POST /api/v1/bulk-upload
   */
  uploadBulkUrls = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { file } = req;
    const { parsedData } = req;

    // Validate file exists
    if (!file) {
      return sendResponse(res, 400, false, "No file uploaded");
    }

    // Validate data exists
    if (!parsedData || parsedData.length === 0) {
      return sendResponse(res, 400, false, "No valid data found in file");
    }

    const result = await this.bulkUploadService.createBulkUpload(
      userId,
      file.originalname,
      parsedData
    );

    return sendResponse(
      res,
      201,
      true,
      "Bulk upload created successfully",
      result
    );
  });

  /**
   * Get bulk upload status
   * GET /api/v1/bulk-upload/:id
   */
  getBulkUploadStatus = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await this.bulkUploadService.getBulkUploadStatus(id, userId);

    return sendResponse(res, 200, true, "Bulk upload status retrieved", result);
  });

  /**
   * Get all bulk uploads
   * GET /api/v1/bulk-upload
   */
  getAllBulkUploads = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    const result = await this.bulkUploadService.getUserBulkUploads(
      userId,
      pagination,
      status
    );

    return sendResponse(res, 200, true, "Bulk uploads retrieved", result);
  });

  /**
   * Cancel bulk upload
   * POST /api/v1/bulk-upload/:id/cancel
   */
  cancelBulkUpload = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await this.bulkUploadService.cancelBulkUpload(id, userId);

    return sendResponse(
      res,
      200,
      true,
      "Bulk upload cancelled successfully",
      result
    );
  });

  /**
   * Download template
   * GET /api/v1/bulk-upload/template
   */
  downloadTemplate = catchAsync(async (req, res) => {
    const { format = "csv" } = req.query;

    const template = await this.bulkUploadService.generateTemplate(format);

    // Set appropriate headers for download
    const fileName = `bulk-upload-template.${
      format === "csv" ? "csv" : "xlsx"
    }`;
    const contentType =
      format === "csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    return res.send(template);
  });

  /**
   * Get upload statistics
   * GET /api/v1/bulk-upload/stats
   */
  getUploadStats = catchAsync(async (req, res) => {
    const userId = req.user.id;

    const stats = await this.bulkUploadService.getUploadStats(userId);

    return sendResponse(res, 200, true, "Upload statistics retrieved", stats);
  });
}

module.exports = new BulkUploadController();
