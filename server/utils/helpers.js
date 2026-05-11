import slugify from "slugify";

export function handlePostgreError(err) {
  switch (err.code) {
    case "23505": // unique_violation
      // Try to make it user-friendly using constraint or detail
      let field = "resource";
      if (err.constraint) {
        // e.g., users_email_key → "email"
        field = err.constraint.replace(/_key$/, "").split("_").pop();
      } else if (err.detail) {
        // detail often says: Key (email)=(test@example.com) already exists.
        const match = err.detail.match(/\(([^)]+)\)/);
        if (match) field = match[1];
      }
      return {
        status: 409, // Conflict is better than 400 for duplicates
        message: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } already exists.`,
      };

    case "23503": // foreign_key_violation
      return {
        status: 400,
        message: "Referenced record does not exist or cannot be used.",
      };

    case "23502": // not_null_violation
      let column = err.column || "required field";
      return {
        status: 400,
        message: `Missing required field: ${column}.`,
      };

    case "23514": // check_violation
      return {
        status: 400,
        message: "Invalid data provided (check constraint failed).",
      };

    case "42P01": // undefined_table
    case "42703": // undefined_column
      return {
        status: 500,
        message: "Database configuration error.",
      };

    case "40001": // serialization_failure
    case "40P01": // deadlock_detected
      return {
        status: 409,
        message: "Temporary conflict detected. Please retry the operation.",
      };

    case "22P02": // invalid_text_representation (e.g., wrong UUID format)
      return {
        status: 400,
        message: "Invalid data format.",
      };

    default:
      // Log more details in dev, but keep response safe
      console.error("Unhandled PostgreSQL error:", {
        code: err.code,
        message: err.message,
        detail: err.detail,
        table: err.table,
      });
      return {
        status: 500,
        message: "Database error occurred.",
      };
  }
}

export const generateSlug = (text) => {
  return slugify(text, {
    lower: true, // convert to lowercase
    strict: true, // remove special chars like !, @,  #
    trim: true, // remove leading/trailing spaces
  });
};

/**
 * Detects mentions in plain text (like "@username") and returns:
 *  - mentions: array of mentioned usernames
 *  - processedText: unchanged original text
 *  - users: user documents of mentioned users (for notifications)
 */
export const handleMentions = async (text) => {
  try {
    // Handle invalid or empty text
    if (!text || typeof text !== "string") {
      return { mentions: [], processedText: text, users: [] };
    }

    // Find mentions like "@username" or "@philip33"
    // Matches only letters, numbers, and underscores
    const mentionMatches = text.match(/@([a-zA-Z0-9_]+)/g) || [];

    // Extract clean usernames (remove "@")
    const mentions = mentionMatches.map((m) => m.slice(1));

    if (mentions.length === 0) {
      return { mentions: [], processedText: text, users: [] };
    }

    // Find all mentioned users in database
    const users = await User.find({ username: { $in: mentions } }).select(
      "_id username profileImage"
    );

    // Return mentions, original text, and matched users
    return { mentions, processedText: text, users };
  } catch (error) {
    console.error("Error parsing mentions:", error);
    return { mentions: [], processedText: text, users: [] };
  }
};

/**
 * Restrict access to certain roles
 * @param  {...string} roles - allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access forbidden' });
    }
    next();
  };
};

export default restrictTo;