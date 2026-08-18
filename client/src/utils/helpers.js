// src/utils/helpers.js

/**
 * Format date string to readable format
 */
export const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

/**
 * Get status badge variant
 */
export const getStatusBadgeVariant = (status) => {
  const variants = {
    active: "success",
    inactive: "neutral",
    blocked: "error",
    flagged: "warning",
    expired: "error",
  };
  return variants[status] || "neutral";
};

/**
 * Get status label
 */
export const getStatusLabel = (status) => {
  const labels = {
    active: "Active",
    inactive: "Inactive",
    blocked: "Blocked",
    flagged: "Flagged",
    expired: "Expired",
  };
  return labels[status] || status;
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy:", err);
    return false;
  }
};

/**
 * Validate URL
 */
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};
