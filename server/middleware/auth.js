// middleware/auth.middleware.js
import {
  verifyToken,
  generateTokens,
  setAuthCookies,
  clearAuthCookies,
  revokeRefreshToken,
} from "../utils/generateToken.js";
import { supabase } from "../config/supabase.js";
import { UnauthorizedError } from "../errors/customErrors.js";

export const auth = async (req, res, next) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  // Always start clean
  req.user = null;
  req.userId = null;

  // No tokens at all → immediate unauthorized
  if (!accessToken && !refreshToken) {
    return next(new UnauthorizedError("Authentication required"));
  }

  try {
    let userId = null;

    // 1. Try access token first (preferred)
    if (accessToken) {
      try {
        const payload = verifyToken(accessToken, "access");
        userId = payload.id;
      } catch (err) {
        console.log("Access token expired, attempting refresh...");
      }
    }

    // 2. If no valid access token, try refresh token + rotation
    if (!userId && refreshToken) {
      try {
        const refreshPayload = verifyToken(refreshToken, "refresh");
        userId = refreshPayload.id;

        // Check if refresh token is revoked in database
        const { data: tokenData, error: tokenError } = await supabase
          .from("user_tokens")
          .select("revoked")
          .eq("refresh_token", refreshToken)
          .single();

        if (tokenError && tokenError.code !== "PGRST116") {
          throw tokenError;
        }

        if (tokenData?.revoked) {
          throw new Error("Refresh token revoked");
        }

        // Token rotation: Revoke old token and generate new ones
        await revokeRefreshToken(refreshToken);
        const { accessToken: newAccess, refreshToken: newRefresh } =
          generateTokens(userId);

        // Store new refresh token
        await supabase.from("user_tokens").insert({
          user_id: userId,
          refresh_token: newRefresh,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
        });

        setAuthCookies(res, newAccess, newRefresh);
      } catch (err) {
        // Refresh token also invalid → clear cookies and fail
        clearAuthCookies(res);
        return next(
          new UnauthorizedError("Session expired. Please log in again.")
        );
      }
    }

    // 3. Still no valid userId after both attempts
    if (!userId) {
      clearAuthCookies(res);
      return next(
        new UnauthorizedError(
          "Invalid or expired session. Please log in again."
        )
      );
    }

    // 4. Fetch fresh user data from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        `
        id, 
        full_name, 
        username, 
        email, 
        role, 
        status,
        is_online,
        avatar_url,
        plan,
        email_verified
      `
      )
      .eq("id", userId)
      .single();

    if (userError || !user) {
      clearAuthCookies(res);
      return next(new UnauthorizedError("User account no longer exists."));
    }

    // Check if user is banned/suspended
    if (user.status === "banned" || user.status === "suspended") {
      clearAuthCookies(res);
      return next(
        new UnauthorizedError("Your account has been suspended or banned.")
      );
    }

    // Check if email is verified (optional, can be disabled for testing)
    if (
      process.env.REQUIRE_EMAIL_VERIFICATION === "true" &&
      !user.email_verified
    ) {
      clearAuthCookies(res);
      return next(
        new UnauthorizedError(
          "Please verify your email address before logging in."
        )
      );
    }

    // Update last login and online status
    await supabase
      .from("users")
      .update({
        last_login: new Date(),
        is_online: true,
        updated_at: new Date(),
      })
      .eq("id", userId);

    // Attach user to request
    req.user = user;
    req.userId = user.id;

    // Sanitized user for logging/templates
    req.sanitizedUser = {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    console.error("[Auth Middleware Error]:", err.message);
    clearAuthCookies(res);
    next(err);
  }
};

// Optional: API Key authentication middleware
export const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      throw new UnauthorizedError("API key required");
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, full_name, email, role, plan, api_key")
      .eq("api_key", apiKey)
      .single();

    if (error || !user) {
      throw new UnauthorizedError("Invalid API key");
    }

    req.user = user;
    req.userId = user.id;
    req.isApiKeyAuth = true;

    next();
  } catch (error) {
    next(error);
  }
};

export default auth;
