// utils/generateToken.js
import jwt from "jsonwebtoken";
import { supabase } from "../config/supabase.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

// Generate access and refresh tokens
export const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    {
      id: userId,
      type: "access",
    },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    {
      id: userId,
      type: "refresh",
    },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// Verify token
export const verifyToken = (token, type = "access") => {
  const secret = type === "access" ? JWT_SECRET : JWT_REFRESH_SECRET;
  try {
    const decoded = jwt.verify(token, secret);
    if (decoded.type !== type) {
      throw new Error("Invalid token type");
    }
    return decoded;
  } catch (error) {
    throw error;
  }
};

// Set auth cookies
export const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Access token cookie (15 minutes)
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh token cookie (7 days)
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Clear auth cookies
export const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

// Store refresh token in Supabase (for token rotation and logout all devices)
export const storeRefreshToken = async (userId, refreshToken) => {
  const { data, error } = await supabase.from("user_tokens").insert({
    user_id: userId,
    refresh_token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    created_at: new Date(),
  });

  if (error) throw error;
  return data;
};

// Revoke refresh token
export const revokeRefreshToken = async (refreshToken) => {
  const { error } = await supabase
    .from("user_tokens")
    .update({ revoked: true, revoked_at: new Date() })
    .eq("refresh_token", refreshToken);

  if (error) throw error;
};

// Revoke all user tokens (logout all devices)
export const revokeAllUserTokens = async (userId) => {
  const { error } = await supabase
    .from("user_tokens")
    .update({ revoked: true, revoked_at: new Date() })
    .eq("user_id", userId)
    .is("revoked", false);

  if (error) throw error;
};
