// controllers/auth.controller.js
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { supabase, supabaseAdmin } from "../config/supabase.js";
import { sendMail } from "../utils/email.js";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../errors/customErrors.js";

import {
  generateTokens,
  setAuthCookies,
  clearAuthCookies,
  revokeAllUserTokens,
  storeRefreshToken,
} from "../utils/generateToken.js";
import { createRequestContextLogger } from "../utils/logger.js";

// REGISTER

export const register = async (req, res, next) => {
  const log = createRequestContextLogger(req);

  try {
    const { full_name, email, username, password } = req.body;

    if (!email || !password || !username || !full_name) {
      throw new BadRequestError(
        "Full name, email, username, and password are required."
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedFullName = full_name.trim();
    const normalizedUsername = username.trim();

    if (password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters long.");
    }

    // Hash password (for your custom login later)
    const hashedPassword = await bcrypt.hash(password, 12);

    // === 1. Check if user already exists ===
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .or(`email.eq.${normalizedEmail},username.eq.${normalizedUsername}`)
      .single();

    if (existing) {
      throw new ConflictError("Email or username already exists");
    }

    // === 2. Create user in Supabase Auth ===
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password, // Supabase will hash it internally
        email_confirm: true, // Auto-confirm for now (change if needed)
        user_metadata: {
          full_name: normalizedFullName,
          username: normalizedUsername,
        },
      });

    if (authError) {
      throw new BadRequestError(`Failed to create account:`);
    }

    const newAuthUser = authData.user;

    // === 3. Generate verification token (if needed) ===
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // === 4. Create profile in public.users ===
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: newAuthUser.id, // Must match auth.users.id
        full_name: normalizedFullName,
        username: normalizedUsername,
        email: normalizedEmail,
        password_hash: hashedPassword, // ← Your custom hashed password
        role: "user",
        plan: "free",
        status: "active",
        is_active: true,
        email_verified: true, // Since we used email_confirm: true
        email_verification_token: emailVerificationToken,
        email_verification_expires: emailVerificationExpires,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        "id, full_name, email, username, role, is_active, email_verified, created_at"
      )
      .single();

    if (insertError) {
      console.error("Profile Insert Error:", insertError);
      // Optional: Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newAuthUser.id);
      throw new BadRequestError("Failed to create user profile");
    }

    // === Send verification email if required ===
    if (process.env.REQUIRE_EMAIL_VERIFICATION === "true") {
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${emailVerificationToken}`;
      await sendMail(
        newUser.email,
        "Verify Your Email Address",
        `
          <h2>Welcome to URL Shortener!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" target="_blank">Verify Email</a>
          <p>This link expires in 24 hours.</p>
        `
      );
    }

    log.business("user_registered", {
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: newUser.id,
        full_name: newUser.full_name,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        is_active: newUser.is_active,
        email_verified: newUser.email_verified,
        created_at: newUser.created_at,
      },
    });
  } catch (err) {
    log.error(err, { action: "user_registration" });
    next(err);
  }
};

// LOGIN
export const login = async (req, res, next) => {
  const log = createRequestContextLogger(req);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError("Email and password are required.");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(
        "id, full_name, username, email, password_hash, role, status, login_attempts, email_verified"
      )
      .eq("email", normalizedEmail)
      .single();

    if (userError || !user) {
      throw new NotFoundError("User not found");
    }

    // Check if user is banned
    if (user.status === "banned") {
      log.security("banned_user_login_attempt", { email: normalizedEmail });
      throw new UnauthorizedError("Your account has been banned.");
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    const isAdmin = user.role === "admin";

    if (!isMatch) {
      // Increment login attempts
      await supabase
        .from("users")
        .update({
          login_attempts: (user.login_attempts || 0) + 1,
          updated_at: new Date(),
        })
        .eq("id", user.id);

      // Special logging for Admin failed login
      if (isAdmin) {
        log.security("admin_login_failed", {
          email: normalizedEmail,
          role: user.role,
          ip: req.ip,
          userAgent: req.get("User-Agent"),
        });
      }

      throw new UnauthorizedError("Invalid email or password.");
    }

    // Check if email is verified
    if (
      process.env.REQUIRE_EMAIL_VERIFICATION === "true" &&
      !user.email_verified
    ) {
      throw new UnauthorizedError(
        "Please verify your email address before logging in."
      );
    }

    // Reset login attempts and update status
    await supabase
      .from("users")
      .update({
        login_attempts: 0,
        last_login: new Date(),
        is_online: true,
        updated_at: new Date(),
      })
      .eq("id", user.id);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token in database
    await storeRefreshToken(user.id, refreshToken);

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Logging
    if (isAdmin) {
      log.security("admin_login_successful", {
        userId: user.id,
        email: normalizedEmail,
        full_name: user.full_name,
        role: user.role,
        ip: req.ip,
      });
    } else {
      log.business("user_login_successful", {
        userId: user.id,
        role: user.role,
        email: normalizedEmail,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    log.error(err, { action: "user_login" });
    next(err);
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res, next) => {
  const log = createRequestContextLogger(req);

  try {
    const { email } = req.body;

    if (!email) {
      throw new BadRequestError("Email is required.");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .single();

    if (user && !userError) {
      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Save to database
      await supabase
        .from("users")
        .update({
          reset_password_token: hashedToken,
          reset_password_expires: expiresAt,
          updated_at: new Date(),
        })
        .eq("id", user.id);

      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

      await sendMail(
        user.email,
        "Reset Your Password",
        `
          <h2>Password Reset Request</h2>
          <p>You requested a password reset.</p>
          <p>This link expires in 15 minutes.</p>
          <a href="${resetUrl}" target="_blank">Reset Password</a>
          <p>If you didn't request this, please ignore this email.</p>
        `
      );

      log.business("password_reset_requested", {
        userId: user.id,
        email: user.email,
      });
    }

    // Always return the same message (prevents email enumeration attack)
    return res.status(200).json({
      success: true,
      message: "If your email exists, a reset link has been sent.",
    });
  } catch (err) {
    log.error(err, { action: "forgot_password" });
    next(err);
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res, next) => {
  const log = createRequestContextLogger(req);
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (!password || password.length < 8) {
      throw new BadRequestError("Password must be at least 8 characters.");
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("reset_password_token", hashedToken)
      .gte("reset_password_expires", new Date().toISOString())
      .single();

    if (userError || !user) {
      throw new BadRequestError("Invalid or expired reset token.");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear reset tokens
    await supabase
      .from("users")
      .update({
        password_hash: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
        updated_at: new Date(),
      })
      .eq("id", user.id);

    // Revoke all refresh tokens for security
    await revokeAllUserTokens(user.id);

    log.security("password_reset_successful", { userId: user.id });
    log.business("password_reset_completed", { userId: user.id });

    return res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now login with your new password.",
    });
  } catch (err) {
    log.error(err, { action: "reset_password" });
    next(err);
  }
};

// VERIFY EMAIL
export const verifyEmail = async (req, res, next) => {
  const log = createRequestContextLogger(req);
  const { token } = req.params;

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid verification token
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email_verification_token", hashedToken)
      .gte("email_verification_expires", new Date().toISOString())
      .single();

    if (userError || !user) {
      throw new BadRequestError("Invalid or expired verification token.");
    }

    // Update user as verified
    await supabase
      .from("users")
      .update({
        email_verified: true,
        email_verification_token: null,
        email_verification_expires: null,
        updated_at: new Date(),
      })
      .eq("id", user.id);

    log.business("email_verified", { userId: user.id });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now login.",
    });
  } catch (err) {
    log.error(err, { action: "verify_email" });
    next(err);
  }
};

// RESEND VERIFICATION EMAIL
export const resendVerification = async (req, res, next) => {
  const log = createRequestContextLogger(req);

  try {
    const userId = req.userId;

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("email, email_verified")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new NotFoundError("User not found");
    }

    if (user.email_verified) {
      throw new BadRequestError("Email already verified.");
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await supabase
      .from("users")
      .update({
        email_verification_token: emailVerificationToken,
        email_verification_expires: emailVerificationExpires,
        updated_at: new Date(),
      })
      .eq("id", userId);

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${emailVerificationToken}`;

    await sendMail(
      user.email,
      "Verify Your Email Address",
      `
        <h2>Email Verification</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" target="_blank">Verify Email</a>
        <p>This link expires in 24 hours.</p>
      `
    );

    log.business("verification_email_resent", { userId });

    return res.status(200).json({
      success: true,
      message: "Verification email sent successfully.",
    });
  } catch (err) {
    log.error(err, { action: "resend_verification" });
    next(err);
  }
};

// ME (Check user in public pages)
export const me = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(200).json({
        success: true,
        auth: false,
        user: null,
      });
    }

    res.status(200).json({
      success: true,
      auth: true,
      user: {
        id: req.user.id,
        full_name: req.user.full_name,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        avatar_url: req.user.avatar_url,
        plan: req.user.plan,
      },
    });
  } catch (err) {
    next(err);
  }
};

// LOGOUT
export const logout = async (req, res, next) => {
  const log = createRequestContextLogger(req);

  try {
    const userId = req.userId;
    const refreshToken = req.cookies?.refreshToken;

    // Revoke the specific refresh token
    if (refreshToken) {
      await supabase
        .from("user_tokens")
        .update({ revoked: true, revoked_at: new Date() })
        .eq("refresh_token", refreshToken);
    }

    // Update user online status
    await supabase
      .from("users")
      .update({
        is_online: false,
        last_logout: new Date(),
        updated_at: new Date(),
      })
      .eq("id", userId);

    // Clear cookies
    clearAuthCookies(res);

    log.business("user_logged_out", { userId });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    log.error(err, { action: "logout" });
    next(err);
  }
};

// LOGOUT ALL DEVICES
export const logoutAllDevices = async (req, res, next) => {
  const log = createRequestContextLogger(req);

  try {
    const userId = req.userId;

    // Revoke all refresh tokens
    await revokeAllUserTokens(userId);

    // Update user online status
    await supabase
      .from("users")
      .update({
        is_online: false,
        last_logout: new Date(),
        updated_at: new Date(),
      })
      .eq("id", userId);

    // Clear cookies
    clearAuthCookies(res);

    log.security("all_devices_logged_out", { userId });

    return res.status(200).json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (err) {
    log.error(err, { action: "logout_all_devices" });
    next(err);
  }
};

// REFRESH TOKEN
export const refreshToken = async (req, res, next) => {
  const log = createRequestContextLogger(req);

  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token required");
    }

    // Check if token is revoked
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_tokens")
      .select("revoked, user_id")
      .eq("refresh_token", refreshToken)
      .single();

    if (tokenError || !tokenData) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    if (tokenData.revoked) {
      throw new UnauthorizedError("Refresh token has been revoked");
    }

    // Verify the token
    const payload = verifyToken(refreshToken, "refresh");

    if (payload.id !== tokenData.user_id) {
      throw new UnauthorizedError("Token mismatch");
    }

    // Generate new tokens
    const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens(
      payload.id
    );

    // Revoke old token and store new one
    await supabase
      .from("user_tokens")
      .update({ revoked: true, revoked_at: new Date() })
      .eq("refresh_token", refreshToken);

    await storeRefreshToken(payload.id, newRefresh);

    // Set new cookies
    setAuthCookies(res, newAccess, newRefresh);

    log.business("token_refreshed", { userId: payload.id });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
    });
  } catch (err) {
    log.error(err, { action: "refresh_token" });
    clearAuthCookies(res);
    next(err);
  }
};
