// src/services/cache.service.js
const dotenv = require("dotenv");
dotenv.config();
const Redis = require("ioredis");
const logger = require("../utils/logger.util");
const { ApiError } = require("../utils/error.util");

class CacheService {
  constructor() {
    this.defaultTTL = Number(process.env.REDIS_TTL) || 3600;
    this.isAvailable = false;

    this.client = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,

      // Keep retrying, but don't let Redis prevent the app from running
      retryStrategy: (times) => {
        const delay = Math.min(times * 100, 5000);

        logger.warn(`Redis unavailable. Retry attempt ${times} in ${delay}ms`);

        return delay;
      },

      // Don't queue commands indefinitely while Redis is unavailable
      enableOfflineQueue: false,

      // Don't keep retrying an individual command
      maxRetriesPerRequest: 1,

      // Don't throw if Redis isn't immediately available
      lazyConnect: true,
    });

    this.client.on("connect", () => {
      this.isAvailable = true;
      logger.info("Redis connected successfully");
    });

    this.client.on("ready", () => {
      this.isAvailable = true;
      logger.info("Redis is ready");
    });

    this.client.on("error", (err) => {
      this.isAvailable = false;

      logger.error(`Redis error: ${err.message}`);
    });

    this.client.on("close", () => {
      this.isAvailable = false;
      logger.warn("Redis connection closed");
    });

    this.client.on("reconnecting", (delay) => {
      logger.warn(`Redis reconnecting in ${delay}ms`);
    });

    this.client.on("end", () => {
      this.isAvailable = false;
      logger.warn("Redis connection ended");
    });
  }

  /**
   * Get cached data
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Cached data
   */
  async get(key) {
    try {
      const data = await this.client.get(key);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get multiple keys at once
   * @param {Array} keys - Array of cache keys
   * @returns {Promise<Array>} - Array of cached data
   */
  async mget(keys) {
    try {
      const results = await this.client.mget(keys);
      return results.map((data) => (data ? JSON.parse(data) : null));
    } catch (error) {
      logger.error("Cache mget error:", error);
      return keys.map(() => null);
    }
  }

  /**
   * Set cached data
   * @param {string} key - Cache key
   * @param {any} value - Data to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl > 0) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set multiple keys at once
   * @param {Object} entries - Key-value pairs
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async mset(entries, ttl = this.defaultTTL) {
    try {
      const pipeline = this.client.pipeline();

      for (const [key, value] of Object.entries(entries)) {
        const serialized = JSON.stringify(value);
        if (ttl > 0) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error("Cache mset error:", error);
      return false;
    }
  }

  /**
   * Delete cached data
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async delete(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys
   * @param {Array} keys - Array of cache keys
   * @returns {Promise<boolean>} - Success status
   */
  async mdelete(keys) {
    try {
      await this.client.del(keys);
      return true;
    } catch (error) {
      logger.error("Cache mdelete error:", error);
      return false;
    }
  }

  /**
   * Clear cache by pattern
   * @param {string} pattern - Cache key pattern
   * @returns {Promise<number>} - Number of deleted keys
   */
  async clear(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return keys.length;
    } catch (error) {
      logger.error(`Cache clear error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Increment cache value
   * @param {string} key - Cache key
   * @param {number} amount - Increment amount
   * @returns {Promise<number>} - New value
   */
  async increment(key, amount = 1) {
    try {
      return await this.client.incrby(key, amount);
    } catch (error) {
      logger.error(`Cache increment error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Decrement cache value
   * @param {string} key - Cache key
   * @param {number} amount - Decrement amount
   * @returns {Promise<number>} - New value
   */
  async decrement(key, amount = 1) {
    try {
      return await this.client.decrby(key, amount);
    } catch (error) {
      logger.error(`Cache decrement error for key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Exists status
   */
  async exists(key) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache TTL
   * @param {string} key - Cache key
   * @returns {Promise<number>} - TTL in seconds
   */
  async getTTL(key) {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  /**
   * Set expiration for key
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async expire(key, ttl) {
    try {
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache statistics
   */
  async getStats() {
    try {
      const info = await this.client.info("stats");
      const stats = {};

      info.split("\n").forEach((line) => {
        const [key, value] = line.split(":");
        if (key && value) {
          stats[key.trim()] = value.trim();
        }
      });

      return {
        hits: parseInt(stats.keyspace_hits) || 0,
        misses: parseInt(stats.keyspace_misses) || 0,
        hitRate:
          stats.keyspace_hits && stats.keyspace_misses
            ? (
                (parseInt(stats.keyspace_hits) /
                  (parseInt(stats.keyspace_hits) +
                    parseInt(stats.keyspace_misses))) *
                100
              ).toFixed(2)
            : 0,
        keys: await this.client.dbsize(),
      };
    } catch (error) {
      logger.error("Cache stats error:", error);
      return { hits: 0, misses: 0, hitRate: 0, keys: 0 };
    }
  }

  /**
   * Flush all cache
   * @returns {Promise<boolean>} - Success status
   */
  async flush() {
    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error("Cache flush error:", error);
      return false;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    await this.client.quit();
    logger.info("Redis connection closed");
  }

  /**
   * Check Redis health
   * @returns {Promise<boolean>} - Health status
   */
  async healthCheck() {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error("Redis health check failed:", error);
      return false;
    }
  }
}

module.exports = CacheService;
