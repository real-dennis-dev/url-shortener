// auth.middleware.js
const { AUTH_CONSTANTS } = require("./auth.types.js");
const authUtils = require("./auth.utils.js");
const AuthService = require("./auth.service.js");
const SessionService = require("./session.service.js");

const authService = new AuthService();
const sessionService = new SessionService();

const authMiddleware = {
  /**
   * Authenticate user using JWT from cookies or Authorization header
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  authenticate: async (req, res, next) => {
    try {
      // Try to get token from cookies first
      let token = req.cookies[AUTH_CONSTANTS.COOKIE_NAMES.ACCESS_TOKEN];

      // If not in cookies, try Authorization header
      if (!token) {
        token = authUtils.extractBearerToken(req);
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Authentication required. No token provided.",
        });
      }

      // Verify token
      const decoded = authUtils.verifyJWT(token, "access");

      // Check if token is expired
      if (authUtils.isTokenExpired(decoded)) {
        return res.status(401).json({
          success: false,
          message: "Token has expired. Please refresh.",
        });
      }

      // Get user from database
      const user = await authService.getUserById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found.",
        });
      }

      // Check if user is active
      if (user.status !== AUTH_CONSTANTS.STATUS.ACTIVE) {
        return res.status(403).json({
          success: false,
          message: `Account is ${user.status}. Please contact support.`,
        });
      }

      // Validate session token
      const sessionToken =
        req.cookies[AUTH_CONSTANTS.COOKIE_NAMES.SESSION_TOKEN];
      if (sessionToken) {
        const isValid = await sessionService.validateSession(
          sessionToken,
          decoded.id
        );
        if (!isValid) {
          // Session invalid, but we still allow request with new session
          // Create new session
          const newSession = await sessionService.createSession(
            decoded.id,
            req.ip,
            req.headers["user-agent"]
          );
          // Set new session cookie
          authUtils.setAuthCookies(res, {
            sessionToken: newSession.session_token,
          });
        } else {
          // Update session last activity
          await sessionService.updateSessionActivity(sessionToken);
        }
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
        fullName: user.full_name,
        status: user.status,
        emailVerified: user.email_verified,
        apiKey: user.api_key,
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication credentials.",
        error: error.message,
      });
    }
  },

  /**
   * Check user role permissions
   * @param {string[]} roles - Array of allowed roles
   * @returns {Function} Middleware function
   */
  authorize: (roles = []) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      if (roles.length > 0 && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message:
            "Insufficient permissions. Required roles: " + roles.join(", "),
        });
      }

      next();
    };
  },

  /**
   * Rate limiting per user/API key
   * @param {number} windowMs - Time window in milliseconds
   * @param {number} maxRequests - Maximum requests per window
   * @returns {Function} Middleware function
   */
  rateLimiter: (windowMs = 60000, maxRequests = 100) => {
    const requests = new Map();

    return (req, res, next) => {
      const key =
        req.user?.id || req.ip || req.headers["x-api-key"] || "anonymous";
      const now = Date.now();

      if (!requests.has(key)) {
        requests.set(key, { count: 1, resetTime: now + windowMs });
        return next();
      }

      const data = requests.get(key);

      if (now > data.resetTime) {
        data.count = 1;
        data.resetTime = now + windowMs;
        return next();
      }

      data.count++;

      if (data.count > maxRequests) {
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((data.resetTime - now) / 1000),
        });
      }

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, maxRequests - data.count)
      );
      res.setHeader("X-RateLimit-Reset", Math.ceil(data.resetTime / 1000));

      next();
    };
  },

  /**
   * Authenticate using API key
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  authenticateApiKey: async (req, res, next) => {
    try {
      const apiKey = req.headers["x-api-key"] || req.query.api_key;

      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: "API key required.",
        });
      }

      // Validate API key
      const user = await authService.validateApiKey(apiKey);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid API key.",
        });
      }

      // Check if user is active
      if (user.status !== AUTH_CONSTANTS.STATUS.ACTIVE) {
        return res.status(403).json({
          success: false,
          message: `Account is ${user.status}. Please contact support.`,
        });
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
        fullName: user.full_name,
        status: user.status,
        apiKey: user.api_key,
      };

      // Log API usage
      await authService.logApiUsage(apiKey, req);

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid API key.",
        error: error.message,
      });
    }
  },

  /**
   * Check if email is verified
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  requireEmailVerification: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!req.user.emailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Email verification required. Please verify your email address.",
      });
    }

    next();
  },

  /**
   * Check if user has premium plan
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  requirePremium: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const premiumPlans = ["pro", "business", "enterprise"];
    if (!premiumPlans.includes(req.user.plan)) {
      return res.status(403).json({
        success: false,
        message: "Premium subscription required for this feature.",
      });
    }

    next();
  },

  /**
   * Sanitize user input
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  sanitizeInput: (req, res, next) => {
    // Sanitize request body
    if (req.body) {
      Object.keys(req.body).forEach((key) => {
        if (typeof req.body[key] === "string") {
          // Remove potential XSS
          req.body[key] = req.body[key].trim().replace(/[<>]/g, "");
        }
      });
    }

    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach((key) => {
        if (typeof req.query[key] === "string") {
          req.query[key] = req.query[key].trim().replace(/[<>]/g, "");
        }
      });
    }

    next();
  },
};
module.exports = authMiddleware;
