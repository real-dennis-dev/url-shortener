import { supabase } from "../config/supabase.js";
import { createRequestContextLogger } from "../utils/logger.js";
import { nanoid } from "nanoid";
import { BadRequestError, UnauthorizedError } from "../errors/customErrors.js";
import { LinkValidationController } from "./linkValidation.js";
import * as XLSX from "xlsx";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

export class BulkUrlController {
  /**
   * Bulk create URLs from array
   */
  static async bulkCreateUrls(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { urls } = req.body;
      const userId = req.user?.id;

      if (!userId) throw new UnauthorizedError("Not authenticated");

      if (!Array.isArray(urls) || urls.length === 0) {
        throw new BadRequestError("Please provide an array of URLs");
      }

      if (urls.length > 100) {
        throw new BadRequestError("Maximum 100 URLs per batch");
      }

      const results = [];
      const errors = [];

      for (const item of urls) {
        try {
          const { originalUrl, customAlias, title, tags } = item;

          if (!originalUrl) {
            errors.push({ originalUrl, error: "Original URL is required" });
            continue;
          }

          // Validate URL
          try {
            new URL(originalUrl);
          } catch {
            errors.push({ originalUrl, error: "Invalid URL format" });
            continue;
          }

          // Generate short code
          let shortCode = customAlias;
          if (customAlias) {
            const { data: existing } = await supabase
              .from("urls")
              .select("short_code")
              .eq("short_code", customAlias)
              .single();

            if (existing) {
              errors.push({
                originalUrl,
                customAlias,
                error: "Custom alias already taken",
              });
              continue;
            }
          } else {
            let isUnique = false;
            while (!isUnique) {
              shortCode = nanoid(6);
              const { data: existing } = await supabase
                .from("urls")
                .select("short_code")
                .eq("short_code", shortCode)
                .single();

              if (!existing) isUnique = true;
            }
          }

          const urlData = {
            original_url: originalUrl,
            short_code: shortCode,
            user_id: userId,
            title: title || null,
            tags: tags || null,
            is_active: true,
            click_count: 0,
          };

          const { data, error } = await supabase
            .from("urls")
            .insert([urlData])
            .select()
            .single();

          if (error) throw error;

          results.push({
            originalUrl,
            shortCode,
            shortUrl: `${process.env.BASE_URL}/${shortCode}`,
            id: data.id,
          });
        } catch (error) {
          errors.push({ originalUrl: item.originalUrl, error: error.message });
        }
      }

      log.business("bulk_urls_created", {
        userId,
        total: urls.length,
        successful: results.length,
        failed: errors.length,
      });

      log.performance("bulk_create_urls", Date.now() - startTime);

      res.json({
        success: true,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: urls.length,
            created: results.length,
            failed: errors.length,
          },
        },
      });
    } catch (error) {
      log.error(error, { action: "bulk_create_urls" });
      next(error);
    }
  }

  /**
   * Upload and process CSV/Excel file
   */
  static async uploadFile(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      if (!req.file) {
        throw new BadRequestError("Please upload a file");
      }

      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      const fileType = req.file.mimetype;
      let urls = [];

      if (fileType === "text/csv" || req.file.originalname.endsWith(".csv")) {
        urls = await this.parseCSV(req.file.buffer);
      } else if (
        fileType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        req.file.originalname.endsWith(".xlsx")
      ) {
        urls = await this.parseExcel(req.file.buffer);
      } else {
        throw new BadRequestError(
          "Unsupported file format. Please upload CSV or Excel file"
        );
      }

      if (urls.length === 0) {
        throw new BadRequestError("No valid URLs found in file");
      }

      // Process the URLs
      const results = await this.processBulkUrls(urls, userId);

      log.business("bulk_url_file_uploaded", {
        userId,
        filename: req.file.originalname,
        totalUrls: urls.length,
        successful: results.successful.length,
      });

      log.performance("upload_bulk_file", Date.now() - startTime);

      res.json({
        success: true,
        data: results,
        file: {
          name: req.file.originalname,
          size: req.file.size,
          type: fileType,
        },
      });
    } catch (error) {
      log.error(error, { action: "upload_bulk_file" });
      next(error);
    }
  }

  /**
   * Get bulk upload history
   */
  static async getBulkHistory(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const {
        data: batches,
        error,
        count,
      } = await supabase
        .from("bulk_uploads")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      log.performance("get_bulk_history", Date.now() - startTime);

      res.json({
        success: true,
        data: batches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      log.error(error, { action: "get_bulk_history" });
      next(error);
    }
  }

  /**
   * Get bulk job status
   */
  static async getBulkJobStatus(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { jobId } = req.params;
      const userId = req.user?.id;

      const { data: job, error } = await supabase
        .from("bulk_uploads")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error || !job) {
        throw new BadRequestError("Bulk job not found");
      }

      if (job.user_id !== userId && req.user?.role !== "admin") {
        throw new UnauthorizedError("Access denied");
      }

      log.performance("get_bulk_job_status", Date.now() - startTime);

      res.json({
        success: true,
        data: job,
      });
    } catch (error) {
      log.error(error, { action: "get_bulk_job_status" });
      next(error);
    }
  }

  /**
   * Download bulk upload template
   */
  static async downloadTemplate(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { format = "csv" } = req.query;

      const template = [
        {
          originalUrl: "https://example.com/page1",
          customAlias: "example1",
          title: "Example Page 1",
          tags: "example,test",
        },
        {
          originalUrl: "https://example.com/page2",
          customAlias: "",
          title: "Example Page 2",
          tags: "example",
        },
        {
          originalUrl: "https://google.com",
          customAlias: "google",
          title: "Google Search",
          tags: "search,popular",
        },
      ];

      if (format === "csv") {
        const csv = this.convertToCSV(template);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="bulk_url_template.csv"'
        );
        return res.send(csv);
      } else {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(template);
        XLSX.utils.book_append_sheet(workbook, worksheet, "URLs");
        const buffer = XLSX.write(workbook, {
          type: "buffer",
          bookType: "xlsx",
        });

        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="bulk_url_template.xlsx"'
        );
        return res.send(buffer);
      }
    } catch (error) {
      log.error(error, { action: "download_template" });
      next(error);
    }
  }

  /**
   * Cancel a bulk upload job
   */
  static async cancelBulkJob(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { jobId } = req.params;
      const userId = req.user?.id;

      if (!userId) throw new UnauthorizedError("Not authenticated");

      // Check if job exists and belongs to user
      const { data: job, error: fetchError } = await supabase
        .from("bulk_uploads")
        .select("id, user_id, status")
        .eq("id", jobId)
        .single();

      if (fetchError || !job) {
        throw new NotFoundError("Bulk job not found");
      }

      if (job.user_id !== userId && req.user?.role !== "admin") {
        throw new UnauthorizedError("Access denied");
      }

      if (["completed", "failed", "cancelled"].includes(job.status)) {
        throw new BadRequestError(
          `Cannot cancel a job that is already ${job.status}`
        );
      }

      const { error } = await supabase
        .from("bulk_uploads")
        .update({
          status: "cancelled",
          updated_at: new Date(),
          notes: "Cancelled by user",
        })
        .eq("id", jobId);

      if (error) throw error;

      log.business("bulk_job_cancelled", {
        userId,
        jobId,
      });

      log.performance("cancel_bulk_job", Date.now() - startTime);

      res.json({
        success: true,
        message: "Bulk job cancelled successfully",
      });
    } catch (error) {
      log.error(error, { action: "cancel_bulk_job" });
      next(error);
    }
  }

  /**
   * Retry failed URLs from a previous bulk upload
   */
  static async retryFailedUrls(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { jobId } = req.params;
      const userId = req.user?.id;

      if (!userId) throw new UnauthorizedError("Not authenticated");

      // Get the original job
      const { data: job, error: jobError } = await supabase
        .from("bulk_uploads")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError || !job) {
        throw new NotFoundError("Bulk job not found");
      }

      if (job.user_id !== userId && req.user?.role !== "admin") {
        throw new UnauthorizedError("Access denied");
      }

      if (!job.failed_urls || job.failed_urls.length === 0) {
        throw new BadRequestError("No failed URLs to retry");
      }

      // Retry the failed URLs
      const retryResults = await this.processBulkUrls(job.failed_urls, userId);

      // Update job record
      await supabase
        .from("bulk_uploads")
        .update({
          successful: (job.successful || 0) + retryResults.successful.length,
          failed: retryResults.failed.length,
          status:
            retryResults.failed.length === 0
              ? "completed"
              : "partially_completed",
          updated_at: new Date(),
          notes: `Retried at ${new Date().toISOString()}`,
        })
        .eq("id", jobId);

      log.business("bulk_retry_executed", {
        userId,
        jobId,
        retried: job.failed_urls.length,
        successful: retryResults.successful.length,
        stillFailed: retryResults.failed.length,
      });

      log.performance("retry_failed_urls", Date.now() - startTime);

      res.json({
        success: true,
        data: retryResults,
        message: `Retried ${job.failed_urls.length} URLs with ${retryResults.successful.length} successes`,
      });
    } catch (error) {
      log.error(error, { action: "retry_failed_urls" });
      next(error);
    }
  }

  // Helper methods
  static async parseCSV(buffer) {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from(buffer.toString());

      stream
        .pipe(csv())
        .on("data", (data) => {
          if (data.originalUrl || data.original_url) {
            results.push({
              originalUrl: data.originalUrl || data.original_url,
              customAlias: data.customAlias || data.custom_alias || "",
              title: data.title || "",
              tags: data.tags || "",
            });
          }
        })
        .on("end", () => resolve(results))
        .on("error", reject);
    });
  }

  static async parseExcel(buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    return data
      .map((row) => ({
        originalUrl: row.originalUrl || row.original_url,
        customAlias: row.customAlias || row.custom_alias || "",
        title: row.title || "",
        tags: row.tags || "",
      }))
      .filter((item) => item.originalUrl);
  }

  static async processBulkUrls(urls, userId) {
    const results = [];
    const errors = [];

    for (const item of urls) {
      try {
        if (!item.originalUrl) {
          errors.push({
            originalUrl: item.originalUrl,
            error: "Original URL is required",
          });
          continue;
        }

        // Validate URL
        try {
          new URL(item.originalUrl);
        } catch {
          errors.push({
            originalUrl: item.originalUrl,
            error: "Invalid URL format",
          });
          continue;
        }

        // Generate short code
        let shortCode = item.customAlias;
        if (item.customAlias) {
          const { data: existing } = await supabase
            .from("urls")
            .select("short_code")
            .eq("short_code", item.customAlias)
            .single();

          if (existing) {
            errors.push({
              originalUrl: item.originalUrl,
              customAlias: item.customAlias,
              error: "Custom alias already taken",
            });
            continue;
          }
        } else {
          let isUnique = false;
          while (!isUnique) {
            shortCode = nanoid(6);
            const { data: existing } = await supabase
              .from("urls")
              .select("short_code")
              .eq("short_code", shortCode)
              .single();

            if (!existing) isUnique = true;
          }
        }

        const urlData = {
          original_url: item.originalUrl,
          short_code: shortCode,
          user_id: userId,
          title: item.title || null,
          tags: item.tags ? item.tags.split(",") : null,
          is_active: true,
          click_count: 0,
        };

        const { data, error } = await supabase
          .from("urls")
          .insert([urlData])
          .select()
          .single();

        if (error) throw error;

        results.push({
          originalUrl: item.originalUrl,
          shortCode,
          shortUrl: `${process.env.BASE_URL}/${shortCode}`,
          id: data.id,
        });
      } catch (error) {
        errors.push({ originalUrl: item.originalUrl, error: error.message });
      }
    }

    // Log bulk upload to database
    await supabase.from("bulk_uploads").insert([
      {
        user_id: userId,
        total_urls: urls.length,
        successful: results.length,
        failed: errors.length,
        created_at: new Date(),
        status: "completed",
      },
    ]);

    return {
      successful: results,
      failed: errors,
      summary: {
        total: urls.length,
        created: results.length,
        failed: errors.length,
      },
    };
  }

  static convertToCSV(data) {
    const headers = ["originalUrl", "customAlias", "title", "tags"];
    const rows = data.map((item) =>
      headers
        .map((header) => `"${(item[header] || "").replace(/"/g, '""')}"`)
        .join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }
}
