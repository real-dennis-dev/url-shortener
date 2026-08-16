const { v4: uuidv4 } = require("uuid");
const { DatabaseService } = require("../../services/database.service");
const { CacheService } = require("../../services/cache.service");
const { QueueService } = require("../../services/queue.service");
const bulkUploadUtils = require("./bulk-upload.utils");
const { AppError } = require("../../utils/error.utils");

class BulkUploadService {
  constructor() {
    this.db = new DatabaseService();
    this.cache = new CacheService();
    this.queue = new QueueService();
    this.BULK_UPLOAD_QUEUE = "bulk-upload-processing";
    this.CACHE_KEY_PREFIX = "bulk-upload:";
  }

  /**
   * Create bulk upload job
   */
  async createBulkUpload(userId, filename, data) {
    try {
      // Validate data format
      const validation = await this.validateBulkData(data);
      if (!validation.valid) {
        throw new AppError(400, "Invalid data format", validation.errors);
      }

      // Create bulk upload record
      const bulkUpload = await this.db.transaction(async (client) => {
        const query = `
          INSERT INTO public.bulk_uploads (
            id, user_id, filename, total_urls, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING *
        `;

        const result = await client.query(query, [
          uuidv4(),
          userId,
          filename,
          data.length,
          "pending",
        ]);

        return result.rows[0];
      });

      // Add job to queue for processing
      await this.queue.addJob(
        this.BULK_UPLOAD_QUEUE,
        {
          bulkUploadId: bulkUpload.id,
          userId,
          data,
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        }
      );

      // Cache the bulk upload record
      await this.cache.set(
        `${this.CACHE_KEY_PREFIX}${bulkUpload.id}`,
        bulkUpload,
        3600 // 1 hour TTL
      );

      return {
        jobId: bulkUpload.id,
        status: bulkUpload.status,
        totalUrls: bulkUpload.total_urls,
      };
    } catch (error) {
      console.error("Error creating bulk upload:", error);
      throw error;
    }
  }

  /**
   * Process bulk upload
   */
  async processBulkUpload(jobId) {
    const client = await this.db.getPool().connect();

    try {
      // Get bulk upload record
      const bulkUpload = await this.getBulkUploadRecord(jobId);

      if (!bulkUpload) {
        throw new AppError(404, "Bulk upload not found");
      }

      // Update status to processing
      await this.updateBulkUploadStatus(jobId, "processing");

      // Get data from cache or database
      let data;
      const cachedData = await this.cache.get(
        `${this.CACHE_KEY_PREFIX}data:${jobId}`
      );
      if (cachedData) {
        data = cachedData;
      } else {
        // Fetch data from database if not in cache
        data = await this.getBulkUploadData(jobId);
      }

      // Process URLs in chunks
      const CHUNK_SIZE = 50;
      const chunks = bulkUploadUtils.chunkArray(data, CHUNK_SIZE);
      let successful = 0;
      let failed = 0;
      const errors = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkResults = await this.processUrlChunk(
          bulkUpload.user_id,
          chunk,
          client
        );

        successful += chunkResults.successful;
        failed += chunkResults.failed;
        errors.push(...chunkResults.errors);

        // Update progress
        const progress = ((i + 1) / chunks.length) * 100;
        await this.updateBulkUploadProgress(jobId, progress, {
          successful,
          failed,
          total: data.length,
        });
      }

      // Update final status
      const status = failed === 0 ? "completed" : "completed";
      await this.updateBulkUploadStatus(jobId, status, {
        successful,
        failed,
        errors: errors.length > 0 ? JSON.stringify(errors) : null,
        completed_at: new Date(),
      });

      // Invalidate cache
      await this.cache.delete(`${this.CACHE_KEY_PREFIX}${jobId}`);

      return {
        processed: data.length,
        successful,
        failed,
        errors: errors.slice(0, 10), // Return first 10 errors
      };
    } catch (error) {
      // Update status to failed
      await this.updateBulkUploadStatus(jobId, "failed", {
        error: error.message,
      });
      console.error("Error processing bulk upload:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process a chunk of URLs
   */
  async processUrlChunk(userId, chunk, client) {
    let successful = 0;
    let failed = 0;
    const errors = [];

    for (const entry of chunk) {
      try {
        const validation = bulkUploadUtils.validateUrlEntry(entry);
        if (!validation.valid) {
          failed++;
          errors.push({
            url: entry.url,
            errors: validation.errors,
          });
          continue;
        }

        // Create URL record
        const urlQuery = `
          INSERT INTO public.urls (
            id, short_code, original_url, user_id, title, 
            description, tags, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING *
        `;

        const shortCode = bulkUploadUtils.generateShortCode(6);
        const result = await client.query(urlQuery, [
          uuidv4(),
          shortCode,
          entry.url,
          userId,
          entry.title || null,
          entry.description || null,
          entry.tags || null,
          "active",
        ]);

        successful++;
      } catch (error) {
        failed++;
        errors.push({
          url: entry.url,
          error: error.message,
        });
      }
    }

    return { successful, failed, errors };
  }

  /**
   * Get bulk upload status
   */
  async getBulkUploadStatus(jobId, userId) {
    try {
      // Check cache first
      const cached = await this.cache.get(`${this.CACHE_KEY_PREFIX}${jobId}`);
      if (cached) {
        return this.formatBulkUploadResponse(cached);
      }

      // Get from database
      const query = `
        SELECT 
          bu.*,
          u.email as user_email,
          COUNT(CASE WHEN ua.is_active THEN 1 END) as active_urls
        FROM public.bulk_uploads bu
        LEFT JOIN public.users u ON u.id = bu.user_id
        LEFT JOIN public.urls ua ON ua.user_id = bu.user_id
        WHERE bu.id = $1 AND bu.user_id = $2
        GROUP BY bu.id, u.email
      `;

      const result = await this.db.executeQuery(query, [jobId, userId]);

      if (result.rows.length === 0) {
        throw new AppError(404, "Bulk upload not found");
      }

      const bulkUpload = result.rows[0];

      // Cache the result
      await this.cache.set(
        `${this.CACHE_KEY_PREFIX}${jobId}`,
        bulkUpload,
        300 // 5 minutes TTL
      );

      return this.formatBulkUploadResponse(bulkUpload);
    } catch (error) {
      console.error("Error getting bulk upload status:", error);
      throw error;
    }
  }

  /**
   * Cancel bulk upload
   */
  async cancelBulkUpload(jobId, userId) {
    try {
      // Check if bulk upload exists and belongs to user
      const query = `
        SELECT * FROM public.bulk_uploads 
        WHERE id = $1 AND user_id = $2
      `;
      const result = await this.db.executeQuery(query, [jobId, userId]);

      if (result.rows.length === 0) {
        throw new AppError(404, "Bulk upload not found");
      }

      const bulkUpload = result.rows[0];

      // Check if can be cancelled
      if (!["pending", "processing"].includes(bulkUpload.status)) {
        throw new AppError(400, "Cannot cancel bulk upload in current status");
      }

      // Cancel the job in queue
      await this.queue.cancelJob(jobId);

      // Update status
      const updateQuery = `
        UPDATE public.bulk_uploads 
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const updateResult = await this.db.executeQuery(updateQuery, [jobId]);

      // Invalidate cache
      await this.cache.delete(`${this.CACHE_KEY_PREFIX}${jobId}`);

      return {
        id: updateResult.rows[0].id,
        status: updateResult.rows[0].status,
      };
    } catch (error) {
      console.error("Error cancelling bulk upload:", error);
      throw error;
    }
  }

  /**
   * Get user bulk uploads
   */
  async getUserBulkUploads(userId, pagination, status) {
    try {
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          bu.*,
          COUNT(*) OVER() as total_count
        FROM public.bulk_uploads bu
        WHERE bu.user_id = $1
      `;

      const params = [userId];
      let paramIndex = 2;

      if (status) {
        query += ` AND bu.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += `
        ORDER BY bu.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const result = await this.db.executeQuery(query, params);

      const total =
        result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

      return {
        uploads: result.rows.map((row) => this.formatBulkUploadResponse(row)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error getting user bulk uploads:", error);
      throw error;
    }
  }

  /**
   * Validate bulk data format
   */
  async validateBulkData(data) {
    const errors = [];
    const valid = [];

    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      const validation = bulkUploadUtils.validateUrlEntry(entry);

      if (!validation.valid) {
        errors.push({
          row: i + 1,
          errors: validation.errors,
          data: entry,
        });
      } else {
        valid.push(entry);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      validCount: valid.length,
      errorCount: errors.length,
    };
  }

  /**
   * Generate template
   */
  async generateTemplate(format) {
    const templateData = [
      {
        url: "https://example.com/1",
        title: "Example URL 1",
        description: "This is example URL 1",
        tags: "example,test,url1",
      },
      {
        url: "https://example.com/2",
        title: "Example URL 2",
        description: "This is example URL 2",
        tags: "example,test,url2",
      },
      {
        url: "https://example.com/3",
        title: "Example URL 3",
        description: "This is example URL 3",
        tags: "example,test,url3",
      },
    ];

    if (format === "csv") {
      return bulkUploadUtils.generateCSV(templateData);
    } else if (format === "excel") {
      return bulkUploadUtils.generateExcel(templateData);
    } else {
      throw new AppError(400, "Unsupported format. Use csv or excel");
    }
  }

  /**
   * Get upload statistics
   */
  async getUploadStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_uploads,
          SUM(total_urls) as total_urls,
          SUM(successful) as total_successful,
          SUM(failed) as total_failed,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM public.bulk_uploads
        WHERE user_id = $1
      `;

      const result = await this.db.executeQuery(query, [userId]);
      const stats = result.rows[0];

      // Get recent uploads
      const recentQuery = `
        SELECT id, filename, status, total_urls, created_at
        FROM public.bulk_uploads
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `;
      const recentResult = await this.db.executeQuery(recentQuery, [userId]);

      return {
        summary: stats,
        recent: recentResult.rows,
      };
    } catch (error) {
      console.error("Error getting upload stats:", error);
      throw error;
    }
  }

  // Private helper methods
  async getBulkUploadRecord(jobId) {
    const query = `SELECT * FROM public.bulk_uploads WHERE id = $1`;
    const result = await this.db.executeQuery(query, [jobId]);
    return result.rows[0] || null;
  }

  async getBulkUploadData(jobId) {
    const query = `SELECT data FROM public.bulk_uploads_data WHERE bulk_upload_id = $1`;
    const result = await this.db.executeQuery(query, [jobId]);
    return result.rows[0]?.data || [];
  }

  async updateBulkUploadStatus(jobId, status, additionalData = {}) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    fields.push(`status = $${paramIndex}`);
    values.push(status);
    paramIndex++;

    if (additionalData.successful !== undefined) {
      fields.push(`successful = $${paramIndex}`);
      values.push(additionalData.successful);
      paramIndex++;
    }

    if (additionalData.failed !== undefined) {
      fields.push(`failed = $${paramIndex}`);
      values.push(additionalData.failed);
      paramIndex++;
    }

    if (additionalData.errors) {
      fields.push(`errors = $${paramIndex}`);
      values.push(additionalData.errors);
      paramIndex++;
    }

    if (additionalData.completed_at) {
      fields.push(`completed_at = $${paramIndex}`);
      values.push(additionalData.completed_at);
      paramIndex++;
    }

    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE public.bulk_uploads 
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(jobId);

    const result = await this.db.executeQuery(query, values);
    return result.rows[0];
  }

  async updateBulkUploadProgress(jobId, progress, stats) {
    const query = `
      UPDATE public.bulk_uploads 
      SET 
        progress = $1,
        successful = $2,
        failed = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    const result = await this.db.executeQuery(query, [
      progress,
      stats.successful,
      stats.failed,
      jobId,
    ]);
    return result.rows[0];
  }

  formatBulkUploadResponse(bulkUpload) {
    return {
      id: bulkUpload.id,
      filename: bulkUpload.filename,
      status: bulkUpload.status,
      totalUrls: bulkUpload.total_urls,
      successful: bulkUpload.successful || 0,
      failed: bulkUpload.failed || 0,
      progress: bulkUpload.progress || 0,
      errors: bulkUpload.errors ? JSON.parse(bulkUpload.errors) : null,
      createdAt: bulkUpload.created_at,
      completedAt: bulkUpload.completed_at,
      updatedAt: bulkUpload.updated_at,
    };
  }
}

module.exports = BulkUploadService;
