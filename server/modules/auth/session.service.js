// session.service.js
const DatabaseService = require("../../services/database.service.js");
const CacheService = require("../../services/cache.service.js");
const authUtils = require("./auth.utils.js");

const databaseService = new DatabaseService();
const cacheService = new CacheService();

class SessionService {
  /**
   * Create new session
   * @param {number} userId - User ID
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   * @param {boolean} rememberMe - Remember me
   * @returns {Promise<Object>} Session object
   */
  async createSession(userId, ipAddress, userAgent, rememberMe = false) {
    try {
      const sessionToken = authUtils.generateSessionToken();

      const expiresInSeconds = rememberMe
        ? 30 * 24 * 60 * 60 // 30 days
        : 24 * 60 * 60; // 24 hours

      const result = await databaseService.query(
        `INSERT INTO user_sessions 
       (
         user_id,
         session_token,
         ip_address,
         user_agent,
         expires_at,
         last_activity,
         is_active,
         created_at
       )
       VALUES (
         $1,
         $2,
         $3,
         $4,
         NOW() + ($5 * INTERVAL '1 second'),
         NOW(),
         true,
         NOW()
       )
       RETURNING id, session_token, expires_at, created_at`,
        [userId, sessionToken, ipAddress, userAgent, expiresInSeconds]
      );

      const session = result.rows[0];

      await this.cleanOldSessions(userId, 5);

      return session;
    } catch (error) {
      throw new Error(`Session creation failed: ${error.message}`);
    }
  }

  /**
   * Validate session
   * @param {string} sessionToken - Session token
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Session validity
   */
  async validateSession(sessionToken, userId) {
    try {
      // Try cache first
      const cachedSession = await cacheService.get(`session:${sessionToken}`);
      if (cachedSession) {
        return cachedSession.userId === userId;
      }

      const result = await databaseService.query(
        `SELECT id, user_id, expires_at, is_active
         FROM user_sessions
         WHERE session_token = $1 
         AND user_id = $2 
         AND is_active = true
         AND expires_at > NOW()`,
        [sessionToken, userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      // Cache session
      const session = result.rows[0];
      await cacheService.set(
        `session:${sessionToken}`,
        {
          id: session.id,
          userId: session.user_id,
          expiresAt: session.expires_at,
        },
        3600
      );

      return true;
    } catch (error) {
      console.error("Session validation error:", error);
      return false;
    }
  }

  /**
   * Update session activity
   * @param {string} sessionToken - Session token
   * @returns {Promise<void>}
   */
  async updateSessionActivity(sessionToken) {
    try {
      await databaseService.query(
        "UPDATE user_sessions SET last_activity = NOW() WHERE session_token = $1",
        [sessionToken]
      );

      // Update cache
      const cachedSession = await cacheService.get(`session:${sessionToken}`);
      if (cachedSession) {
        cachedSession.lastActivity = new Date();
        await cacheService.set(`session:${sessionToken}`, cachedSession, 3600);
      }
    } catch (error) {
      console.error("Update session activity error:", error);
    }
  }

  /**
   * Get all user sessions
   * @param {number} userId - User ID
   * @returns {Promise<Array>} User sessions
   */
  async getUserSessions(userId) {
    try {
      const result = await databaseService.query(
        `SELECT id, session_token, ip_address, user_agent, 
                last_activity, created_at, expires_at, is_active
         FROM user_sessions
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows;
    } catch (error) {
      throw new Error(`Get sessions failed: ${error.message}`);
    }
  }

  /**
   * Revoke session
   * @param {string} sessionToken - Session token
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Revocation result
   */
  async revokeSession(sessionToken, userId) {
    try {
      const result = await databaseService.query(
        `UPDATE user_sessions 
         SET is_active = false, 
             revoked_at = NOW()
         WHERE session_token = $1 
         AND user_id = $2
         RETURNING id`,
        [sessionToken, userId]
      );

      if (result.rows.length === 0) {
        throw new Error("Session not found or already revoked");
      }

      // Remove from cache
      await cacheService.delete(`session:${sessionToken}`);

      return {
        success: true,
        message: "Session revoked successfully",
      };
    } catch (error) {
      throw new Error(`Session revocation failed: ${error.message}`);
    }
  }

  /**
   * Revoke all user sessions
   * @param {number} userId - User ID
   * @param {string} exceptSession - Session token to exclude
   * @returns {Promise<Object>} Revocation result
   */
  async revokeAllSessions(userId, exceptSession = null) {
    try {
      let query =
        "UPDATE user_sessions SET is_active = false WHERE user_id = $1";
      const params = [userId];

      if (exceptSession) {
        query += " AND session_token != $2";
        params.push(exceptSession);
      }

      await databaseService.query(query, params);

      // Clear session cache
      if (exceptSession) {
        // Get all sessions to clear cache
        const sessions = await databaseService.query(
          "SELECT session_token FROM user_sessions WHERE user_id = $1",
          [userId]
        );
        for (const session of sessions.rows) {
          if (session.session_token !== exceptSession) {
            await cacheService.delete(`session:${session.session_token}`);
          }
        }
      }

      return {
        success: true,
        message: "All sessions revoked successfully",
      };
    } catch (error) {
      throw new Error(`Revoke all sessions failed: ${error.message}`);
    }
  }

  /**
   * Clean old sessions
   * @param {number} userId - User ID
   * @param {number} keepCount - Number of sessions to keep
   * @returns {Promise<void>}
   */
  async cleanOldSessions(userId, keepCount = 5) {
    try {
      // Get all sessions ordered by last activity
      const sessions = await databaseService.query(
        `SELECT id, session_token 
         FROM user_sessions
         WHERE user_id = $1 AND is_active = true
         ORDER BY last_activity DESC
         OFFSET $2`,
        [userId, keepCount]
      );

      if (sessions.rows.length > 0) {
        const tokenList = sessions.rows.map((s) => s.session_token);
        await databaseService.query(
          `UPDATE user_sessions 
           SET is_active = false 
           WHERE session_token = ANY($1)`,
          [tokenList]
        );

        // Clear cache for each session
        // for (const session of sessions.rows) {
        //   await cacheService.delete(`session:${session.session_token}`);
        // }
      }
    } catch (error) {
      console.error("Clean old sessions error:", error);
    }
  }

  /**
   * Get session statistics
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Session statistics
   */
  async getSessionStats(userId) {
    try {
      const result = await databaseService.query(
        `SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN is_active = true AND expires_at > NOW() THEN 1 END) as active_sessions,
          MAX(created_at) as last_session_created,
          MAX(last_activity) as last_activity
         FROM user_sessions
         WHERE user_id = $1`,
        [userId]
      );

      return result.rows[0];
    } catch (error) {
      throw new Error(`Get session stats failed: ${error.message}`);
    }
  }

  /**
   * Invalidate expired sessions
   * @returns {Promise<number>} Number of sessions invalidated
   */
  async invalidateExpiredSessions() {
    try {
      const result = await databaseService.query(
        `UPDATE user_sessions 
         SET is_active = false
         WHERE expires_at < NOW()
         AND is_active = true
         RETURNING session_token`
      );

      // Clear cache for expired sessions
      for (const session of result.rows) {
        await cacheService.delete(`session:${session.session_token}`);
      }

      return result.rows.length;
    } catch (error) {
      console.error("Invalidate expired sessions error:", error);
      return 0;
    }
  }
}

module.exports = SessionService;
