// src/services/database.service.js
const dotenv = require("dotenv");
dotenv.config();
const { Pool } = require("pg");
const logger = require("../utils/logger.util");
const { ApiError } = require("../utils/error.util");

class DatabaseService {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,

      // Connection pool settings
      max: Number(process.env.DB_POOL_SIZE) || 20,
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis:
        Number(process.env.DB_CONNECTION_TIMEOUT) || 2000,

      // SSL
      ssl:
        process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    });

    // Database connection established
    this.pool.on("connect", () => {
      logger.debug("Database connected successfully");
    });

    // Pool-level error
    this.pool.on("error", (err) => {
      logger.error("Database pool error:", err);
    });

    // Connection acquired from pool
    this.pool.on("acquire", () => {
      logger.debug("Database connection acquired");
    });

    // Connection removed from pool
    this.pool.on("remove", () => {
      logger.debug("Database connection removed");
    });
  }

  /**
   * Execute query with transaction
   * @param {Array} queries - Array of query objects
   * @returns {Promise<Array>} - Array of results
   */
  async transaction(queries) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const results = [];
      for (const query of queries) {
        const result = await client.query(query.text, query.values);
        results.push(result);
      }

      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Transaction failed:", error);
      throw new ApiError(
        500,
        "TRANSACTION_FAILED",
        "Database transaction failed"
      );
    } finally {
      client.release();
    }
  }

  /**
   * Execute query with retry logic
   * @param {Object} query - Query object {text, values}
   * @param {number} retries - Number of retries
   * @returns {Promise<Object>} - Query result
   */
  async executeWithRetry(query, retries = 3) {
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        const result = await this.pool.query(query.text, query.values);
        return result;
      } catch (error) {
        lastError = error;
        logger.warn(`Query attempt ${i + 1} failed:`, error.message);

        if (i < retries - 1) {
          // Wait with exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 1000)
          );
        }
      }
    }

    throw new ApiError(
      500,
      "QUERY_FAILED",
      `Query failed after ${retries} attempts: ${lastError.message}`
    );
  }

  /**
   * Build SQL query
   * @param {string} table - Table name
   * @param {string} operation - Operation type (select, insert, update, delete)
   * @param {Object} data - Data for operation
   * @param {Object} conditions - Query conditions
   * @returns {Object} - Query object {text, values}
   */
  buildQuery(table, operation, data, conditions = {}) {
    let text;
    let values = [];
    let paramIndex = 1;

    switch (operation.toLowerCase()) {
      case "select":
        const columns = data?.columns?.join(", ") || "*";
        const whereClause = this._buildWhereClause(conditions);
        text = `SELECT ${columns} FROM ${table}${whereClause}`;
        values = Object.values(conditions);
        break;

      case "insert":
        const keys = Object.keys(data);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
        const columnsList = keys.join(", ");
        text = `INSERT INTO ${table} (${columnsList}) VALUES (${placeholders}) RETURNING *`;
        values = Object.values(data);
        break;

      case "update":
        const setClause = Object.keys(data)
          .map((key, i) => {
            return `${key} = $${i + 1}`;
          })
          .join(", ");
        const whereClauseUpdate = this._buildWhereClause(conditions);
        text = `UPDATE ${table} SET ${setClause}${whereClauseUpdate} RETURNING *`;
        values = [...Object.values(data), ...Object.values(conditions)];
        break;

      case "delete":
        const whereClauseDelete = this._buildWhereClause(conditions);
        text = `DELETE FROM ${table}${whereClauseDelete} RETURNING *`;
        values = Object.values(conditions);
        break;

      default:
        throw new ApiError(
          400,
          "INVALID_OPERATION",
          `Invalid operation: ${operation}`
        );
    }

    return { text, values };
  }

  /**
   * Build WHERE clause from conditions
   * @param {Object} conditions - Query conditions
   * @returns {string} - WHERE clause
   */
  _buildWhereClause(conditions) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return "";
    }

    const clauses = Object.keys(conditions).map((key, i) => {
      return `${key} = $${i + 1}`;
    });

    return ` WHERE ${clauses.join(" AND ")}`;
  }

  /**
   * Execute raw query
   * @param {string} text - SQL query text
   * @param {Array} values - Query values
   * @returns {Promise<Object>} - Query result
   */
  async query(text, values = []) {
    try {
      const result = await this.pool.query(text, values);
      return result;
    } catch (error) {
      logger.error("Query error:", error);
      throw new ApiError(500, "QUERY_ERROR", "Database query failed");
    }
  }

  /**
   * Get connection pool
   * @returns {Pool} - Database connection pool
   */
  getPool() {
    return this.pool;
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
    logger.info("Database connection closed");
  }

  /**
   * Check database health
   * @returns {Promise<boolean>} - Health status
   */
  async healthCheck() {
    try {
      await this.pool.query("SELECT 1");
      return true;
    } catch (error) {
      logger.error("Health check failed:", error);
      return false;
    }
  }
}

module.exports = DatabaseService;
