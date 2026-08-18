// session.controller.js
const SessionService = require("./session.service.js");
const authMiddleware = require("../../middleware/auth.middleware.js");

const sessionService = new SessionService();

class SessionController {
  /**
   * Get all user sessions
   * @route GET /api/v1/auth/sessions
   */
  async getSessions(req, res, next) {
    try {
      const sessions = await sessionService.getUserSessions(req.user.id);

      // Mask IP addresses for security
      const maskedSessions = sessions.map((session) => ({
        ...session,
        ip_address: authUtils.maskData(session.ip_address),
      }));

      res.json({
        success: true,
        data: maskedSessions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get session statistics
   * @route GET /api/v1/auth/sessions/stats
   */
  async getSessionStats(req, res, next) {
    try {
      const stats = await sessionService.getSessionStats(req.user.id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke a session
   * @route DELETE /api/v1/auth/sessions/:sessionId
   */
  async revokeSession(req, res, next) {
    try {
      const { sessionToken } = req.params;

      const result = await sessionService.revokeSession(
        sessionToken,
        req.user.id
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke all sessions except current
   * @route DELETE /api/v1/auth/sessions/all
   */
  async revokeAllSessions(req, res, next) {
    try {
      const currentSession =
        req.cookies[AUTH_CONSTANTS.COOKIE_NAMES.SESSION_TOKEN];

      const result = await sessionService.revokeAllSessions(
        req.user.id,
        currentSession
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current session details
   * @route GET /api/v1/auth/sessions/current
   */
  async getCurrentSession(req, res, next) {
    try {
      const sessionToken =
        req.cookies[AUTH_CONSTANTS.COOKIE_NAMES.SESSION_TOKEN];

      if (!sessionToken) {
        return res.status(404).json({
          success: false,
          message: "No active session found",
        });
      }

      const session = await databaseService.query(
        `SELECT id, ip_address, user_agent, last_activity, 
                created_at, expires_at
         FROM user_sessions
         WHERE session_token = $1 AND user_id = $2`,
        [sessionToken, req.user.id]
      );

      if (session.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Session not found",
        });
      }

      res.json({
        success: true,
        data: {
          ...session.rows[0],
          ip_address: authUtils.maskData(session.rows[0].ip_address),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SessionController;
