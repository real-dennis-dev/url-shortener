// src/services/queue.service.js
const dotenv = require("dotenv");
dotenv.config();
const Redis = require("ioredis");
const { v4: uuidv4 } = require("uuid"); // npm i uuid
const logger = require("../utils/logger.util");

class QueueService {
  constructor() {
    this.isAvailable = false;
    this.processors = new Map(); // queueName → { concurrency, processor, running }

    this.client = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,

      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 5000);
        logger.warn(
          `Queue Redis unavailable. Retry attempt ${times} in ${delay}ms`
        );
        return delay;
      },

      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    this.client.on("connect", () => {
      this.isAvailable = true;
      logger.info("Queue Redis connected successfully");
    });

    this.client.on("ready", () => {
      this.isAvailable = true;
      logger.info("Queue Redis is ready");
    });

    this.client.on("error", (err) => {
      this.isAvailable = false;
      logger.error(`Queue Redis error: ${err.message}`);
    });

    this.client.on("close", () => {
      this.isAvailable = false;
      logger.warn("Queue Redis connection closed");
    });

    this.client.on("reconnecting", (delay) => {
      logger.warn(`Queue Redis reconnecting in ${delay}ms`);
    });

    this.client.on("end", () => {
      this.isAvailable = false;
      logger.warn("Queue Redis connection ended");
    });
  }

  // ────────────────────────────────────────────────
  // Internal helpers
  // ────────────────────────────────────────────────

  _key(queue, type) {
    return `queue:${queue}:${type}`;
  }

  _jobKey(jobId) {
    return `queue:job:${jobId}`;
  }

  async _safe(operation, fallback = null) {
    if (!this.isAvailable) {
      logger.warn("Queue operation skipped – Redis is unavailable");
      return fallback;
    }
    try {
      return await operation();
    } catch (err) {
      logger.error("Queue Redis operation failed:", err.message);
      this.isAvailable = false;
      return fallback;
    }
  }

  // ────────────────────────────────────────────────
  // Public API
  // ────────────────────────────────────────────────

  /**
   * Add job to queue
   * @param {string} queue
   * @param {object} jobData
   * @param {object} options - { delay, attempts, priority, ... }
   * @returns {Promise<string|null>} jobId
   */
  async addJob(queue, jobData, options = {}) {
    return this._safe(async () => {
      const jobId = uuidv4();
      const job = {
        id: jobId,
        queue,
        data: jobData,
        status: "waiting",
        progress: 0,
        result: null,
        error: null,
        attempts: 0,
        maxAttempts: options.attempts || 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...options,
      };

      const pipeline = this.client.pipeline();
      pipeline.hset(this._jobKey(jobId), {
        data: JSON.stringify(job),
      });
      pipeline.lpush(this._key(queue, "waiting"), jobId);
      await pipeline.exec();

      logger.info(`Job ${jobId} added to queue "${queue}"`);
      return jobId;
    }, null);
  }

  /**
   * Process queue
   * @param {string} queue
   * @param {number} concurrency
   * @param {function} processor - async (job) => result
   */
  async processQueue(queue, concurrency = 1, processor) {
    if (this.processors.has(queue)) {
      logger.warn(`Processor already registered for queue "${queue}"`);
      return;
    }

    this.processors.set(queue, {
      concurrency,
      processor,
      running: true,
      workers: [],
    });

    logger.info(
      `Starting processor for queue "${queue}" (concurrency: ${concurrency})`
    );

    // Start workers
    for (let i = 0; i < concurrency; i++) {
      this._startWorker(queue, i);
    }
  }

  async _startWorker(queue, workerId) {
    const meta = this.processors.get(queue);
    if (!meta) return;

    const workerLoop = async () => {
      while (meta.running) {
        if (!this.isAvailable) {
          await new Promise((r) => setTimeout(r, 3000)); // wait & retry
          continue;
        }

        try {
          // Blocking pop with timeout so we can exit cleanly
          const result = await this.client.brpop(
            this._key(queue, "waiting"),
            5 // 5 second timeout
          );

          if (!result) continue; // timeout → loop again

          const jobId = result[1];
          await this._processJob(queue, jobId, meta.processor);
        } catch (err) {
          if (this.isAvailable) {
            logger.error(
              `Worker ${workerId} error on queue "${queue}":`,
              err.message
            );
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    };

    meta.workers.push(workerLoop());
  }

  async _processJob(queue, jobId, processor) {
    const jobRaw = await this.client.hget(this._jobKey(jobId), "data");
    if (!jobRaw) return;

    let job = JSON.parse(jobRaw);
    job.status = "active";
    job.updatedAt = Date.now();
    await this.client.hset(this._jobKey(jobId), "data", JSON.stringify(job));
    await this.client.lpush(this._key(queue, "active"), jobId);

    try {
      const result = await processor(job);

      job.status = "completed";
      job.progress = 100;
      job.result = result;
      job.updatedAt = Date.now();

      await this.client.hset(this._jobKey(jobId), "data", JSON.stringify(job));
      await this.client.lrem(this._key(queue, "active"), 1, jobId);
      await this.client.lpush(this._key(queue, "completed"), jobId);

      logger.info(`Job ${jobId} completed on queue "${queue}"`);
    } catch (err) {
      job.attempts += 1;
      job.error = err.message;
      job.updatedAt = Date.now();

      if (job.attempts < job.maxAttempts) {
        job.status = "waiting";
        await this.client.hset(
          this._jobKey(jobId),
          "data",
          JSON.stringify(job)
        );
        await this.client.lrem(this._key(queue, "active"), 1, jobId);
        await this.client.lpush(this._key(queue, "waiting"), jobId);
        logger.warn(
          `Job ${jobId} failed, retrying (${job.attempts}/${job.maxAttempts})`
        );
      } else {
        job.status = "failed";
        await this.client.hset(
          this._jobKey(jobId),
          "data",
          JSON.stringify(job)
        );
        await this.client.lrem(this._key(queue, "active"), 1, jobId);
        await this.client.lpush(this._key(queue, "failed"), jobId);
        logger.error(
          `Job ${jobId} permanently failed on queue "${queue}": ${err.message}`
        );
      }
    }
  }

  /**
   * Get job status
   * @param {string} jobId
   * @returns {Promise<{status, progress, result, error}|null>}
   */
  async getJobStatus(jobId) {
    return this._safe(async () => {
      const raw = await this.client.hget(this._jobKey(jobId), "data");
      if (!raw) return null;

      const job = JSON.parse(raw);
      return {
        status: job.status,
        progress: job.progress || 0,
        result: job.result,
        error: job.error || null,
        attempts: job.attempts,
      };
    }, null);
  }

  /**
   * Cancel job (only if still waiting)
   * @param {string} jobId
   * @returns {Promise<{success: boolean}>}
   */
  async cancelJob(jobId) {
    return this._safe(
      async () => {
        const raw = await this.client.hget(this._jobKey(jobId), "data");
        if (!raw) return { success: false };

        const job = JSON.parse(raw);
        if (job.status !== "waiting") {
          return { success: false };
        }

        job.status = "cancelled";
        job.updatedAt = Date.now();

        await this.client.hset(
          this._jobKey(jobId),
          "data",
          JSON.stringify(job)
        );
        await this.client.lrem(this._key(job.queue, "waiting"), 1, jobId);

        logger.info(`Job ${jobId} cancelled`);
        return { success: true };
      },
      { success: false }
    );
  }

  /**
   * Get queue stats
   * @param {string} queue
   * @returns {Promise<{waiting, active, completed, failed}>}
   */
  async getQueueStats(queue) {
    return this._safe(
      async () => {
        const [waiting, active, completed, failed] = await Promise.all([
          this.client.llen(this._key(queue, "waiting")),
          this.client.llen(this._key(queue, "active")),
          this.client.llen(this._key(queue, "completed")),
          this.client.llen(this._key(queue, "failed")),
        ]);

        return { waiting, active, completed, failed };
      },
      { waiting: 0, active: 0, completed: 0, failed: 0 }
    );
  }

  /**
   * Retry all failed jobs in a queue
   * @param {string} queue
   * @returns {Promise<{retriedCount: number}>}
   */
  async retryFailed(queue) {
    return this._safe(
      async () => {
        const failedIds = await this.client.lrange(
          this._key(queue, "failed"),
          0,
          -1
        );
        let retriedCount = 0;

        for (const jobId of failedIds) {
          const raw = await this.client.hget(this._jobKey(jobId), "data");
          if (!raw) continue;

          const job = JSON.parse(raw);
          job.status = "waiting";
          job.attempts = 0;
          job.error = null;
          job.updatedAt = Date.now();

          await this.client.hset(
            this._jobKey(jobId),
            "data",
            JSON.stringify(job)
          );
          await this.client.lrem(this._key(queue, "failed"), 1, jobId);
          await this.client.lpush(this._key(queue, "waiting"), jobId);
          retriedCount++;
        }

        logger.info(`Retried ${retriedCount} failed jobs on queue "${queue}"`);
        return { retriedCount };
      },
      { retriedCount: 0 }
    );
  }

  /**
   * Stop processing a queue (graceful)
   */
  stopQueue(queue) {
    const meta = this.processors.get(queue);
    if (meta) {
      meta.running = false;
      this.processors.delete(queue);
      logger.info(`Stopped processor for queue "${queue}"`);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this._safe(async () => {
      await this.client.ping();
      return true;
    }, false);
  }

  /**
   * Close connection
   */
  async close() {
    // Stop all processors
    for (const queue of this.processors.keys()) {
      this.stopQueue(queue);
    }
    await this.client.quit();
    logger.info("Queue Redis connection closed");
  }
}

module.exports = QueueService;

//usage

// example usage
// const QueueService = require("./services/queue.service");
// const queueService = new QueueService();

// // Add a job (safe even if Redis is down)
// const jobId = await queueService.addJob("emails", { to: "user@example.com" }, {
//   attempts: 5,
// });

// // Start processing (won’t crash if Redis is offline)
// await queueService.processQueue("emails", 3, async (job) => {
//   // your business logic
//   console.log("Processing:", job.data);
//   return { sent: true };
// });

// // Later
// const status = await queueService.getJobStatus(jobId);
// const stats = await queueService.getQueueStats("emails");
