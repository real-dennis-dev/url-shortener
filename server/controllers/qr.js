import QRCode from "qrcode";
import { supabase } from "../config/supabase.js";
import { createRequestContextLogger } from "../utils/logger.js";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../errors/customErrors.js";

export class QRController {
  /**
   * Generate QR code for a short URL
   */
  static async generateQRCode(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const {
        size = 300,
        margin = 2,
        color = "#000000",
        background = "#FFFFFF",
        format = "png",
      } = req.query;
      const userId = req.user?.id;

      // Verify URL exists and user has access
      const { data: url, error } = await supabase
        .from("urls")
        .select("short_code, user_id, is_active")
        .eq("short_code", shortCode)
        .single();

      if (error || !url) {
        throw new NotFoundError("URL not found");
      }

      if (url.user_id !== userId && req.user?.role !== "admin") {
        throw new ForbiddenError(
          "You do not have permission to generate QR code for this URL"
        );
      }

      if (!url.is_active) {
        throw new BadRequestError("Cannot generate QR code for inactive URL");
      }

      const shortUrl = `${process.env.BASE_URL}/${shortCode}`;

      const qrOptions = {
        width: parseInt(size),
        margin: parseInt(margin),
        color: {
          dark: color,
          light: background,
        },
        errorCorrectionLevel: "H",
      };

      if (format === "svg") {
        const qrSVG = await QRCode.toString(shortUrl, {
          type: "svg",
          ...qrOptions,
        });

        log.business("qr_code_generated", {
          shortCode,
          userId,
          format: "svg",
          size,
        });

        log.performance("generate_qr_code", Date.now() - startTime);

        res.setHeader("Content-Type", "image/svg+xml");
        return res.send(qrSVG);
      } else {
        const qrBuffer = await QRCode.toBuffer(shortUrl, qrOptions);

        log.business("qr_code_generated", {
          shortCode,
          userId,
          format: "png",
          size,
        });

        log.performance("generate_qr_code", Date.now() - startTime);

        res.setHeader("Content-Type", "image/png");
        return res.send(qrBuffer);
      }
    } catch (error) {
      log.error(error, { action: "generate_qr_code" });
      next(error);
    }
  }

  /**
   * Download QR code as file
   */
  static async downloadQRCode(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const { size = 500, format = "png", filename } = req.query;
      const userId = req.user?.id;

      const { data: url, error } = await supabase
        .from("urls")
        .select("short_code, user_id")
        .eq("short_code", shortCode)
        .single();

      if (error || !url) {
        throw new NotFoundError("URL not found");
      }

      if (url.user_id !== userId && req.user?.role !== "admin") {
        throw new ForbiddenError("Access denied");
      }

      const shortUrl = `${process.env.BASE_URL}/${shortCode}`;
      const qrBuffer = await QRCode.toBuffer(shortUrl, {
        width: parseInt(size),
        margin: 2,
        errorCorrectionLevel: "H",
      });

      const downloadFilename = filename || `qrcode_${shortCode}.${format}`;

      log.business("qr_code_downloaded", {
        shortCode,
        userId,
        format,
        size,
      });

      log.performance("download_qr_code", Date.now() - startTime);

      res.setHeader("Content-Type", `image/${format}`);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${downloadFilename}"`
      );
      res.send(qrBuffer);
    } catch (error) {
      log.error(error, { action: "download_qr_code" });
      next(error);
    }
  }

  /**
   * Generate QR code with custom styling
   */
  static async generateStyledQRCode(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const {
        size = 400,
        logo,
        gradientStart,
        gradientEnd,
        pattern,
      } = req.body;

      const userId = req.user?.id;

      const { data: url, error } = await supabase
        .from("urls")
        .select("short_code, user_id")
        .eq("short_code", shortCode)
        .single();

      if (error || !url) {
        throw new NotFoundError("URL not found");
      }

      if (url.user_id !== userId && req.user?.role !== "admin") {
        throw new ForbiddenError("Access denied");
      }

      const shortUrl = `${process.env.BASE_URL}/${shortCode}`;
      let qrOptions = {
        width: parseInt(size),
        margin: 2,
        errorCorrectionLevel: "H",
      };

      if (gradientStart && gradientEnd) {
        // For gradient, we need to generate and then process
        qrOptions.color = {
          dark: gradientStart,
          light: "#FFFFFF",
        };
      }

      let qrBuffer = await QRCode.toBuffer(shortUrl, qrOptions);

      // If logo is provided, we would need to composite (requires sharp or similar)
      // This is a placeholder for more advanced QR styling

      log.business("styled_qr_code_generated", {
        shortCode,
        userId,
        hasLogo: !!logo,
        hasGradient: !!(gradientStart && gradientEnd),
      });

      log.performance("generate_styled_qr_code", Date.now() - startTime);

      res.setHeader("Content-Type", "image/png");
      res.send(qrBuffer);
    } catch (error) {
      log.error(error, { action: "generate_styled_qr_code" });
      next(error);
    }
  }

  /**
   * Get QR code statistics (how many times scanned/downloaded)
   */
  static async getQRStats(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const userId = req.user?.id;

      const { data: url, error } = await supabase
        .from("urls")
        .select("id, user_id, click_count")
        .eq("short_code", shortCode)
        .single();

      if (error || !url) {
        throw new NotFoundError("URL not found");
      }

      if (url.user_id !== userId && req.user?.role !== "admin") {
        throw new ForbiddenError("Access denied");
      }

      // Get QR-specific analytics from a separate table if you track QR scans
      const { data: qrScans, error: qrError } = await supabase
        .from("qr_scans")
        .select("*")
        .eq("url_id", url.id);

      const stats = {
        total_qr_scans: qrScans?.length || 0,
        total_url_clicks: url.click_count,
        qr_contribution_percentage: qrScans?.length
          ? ((qrScans.length / url.click_count) * 100).toFixed(1)
          : 0,
        last_scan: qrScans?.[0]?.scanned_at || null,
      };

      log.performance("get_qr_stats", Date.now() - startTime);

      res.json({ success: true, data: stats });
    } catch (error) {
      log.error(error, { action: "get_qr_stats" });
      next(error);
    }
  }

  /**
   * Bulk generate QR codes for multiple URLs
   */
  static async bulkGenerateQR(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCodes } = req.body;
      const userId = req.user?.id;

      if (!Array.isArray(shortCodes) || shortCodes.length === 0) {
        throw new BadRequestError("Please provide an array of short codes");
      }

      if (shortCodes.length > 20) {
        throw new BadRequestError("Maximum 20 QR codes per batch");
      }

      const qrResults = [];

      for (const shortCode of shortCodes) {
        try {
          const { data: url, error } = await supabase
            .from("urls")
            .select("short_code, user_id")
            .eq("short_code", shortCode)
            .single();

          if (
            error ||
            !url ||
            (url.user_id !== userId && req.user?.role !== "admin")
          ) {
            qrResults.push({
              shortCode,
              success: false,
              error: "Access denied or URL not found",
            });
            continue;
          }

          const shortUrl = `${process.env.BASE_URL}/${shortCode}`;
          const qrBuffer = await QRCode.toBuffer(shortUrl, {
            width: 200,
            margin: 2,
          });
          const qrBase64 = qrBuffer.toString("base64");

          qrResults.push({
            shortCode,
            success: true,
            qrCode: `data:image/png;base64,${qrBase64}`,
          });
        } catch (err) {
          qrResults.push({ shortCode, success: false, error: err.message });
        }
      }

      log.business("bulk_qr_generated", {
        userId,
        totalRequested: shortCodes.length,
        successful: qrResults.filter((r) => r.success).length,
      });

      log.performance("bulk_generate_qr", Date.now() - startTime);

      res.json({ success: true, data: qrResults });
    } catch (error) {
      log.error(error, { action: "bulk_generate_qr" });
      next(error);
    }
  }
}
