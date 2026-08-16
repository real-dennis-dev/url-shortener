// src/modules/urls/utils/url.utils.js
const crypto = require("crypto");
const axios = require("axios");
const { URL } = require("url");
const validator = require("validator");

const urlUtils = {
  // Generate short code
  generateShortCode: (length = 6) => {
    // Parameters: length (integer)
    // Returns: shortCode (string)
    // Generates unique alphanumeric short code
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // Generate unique short code with collision check
  generateUniqueShortCode: async (length = 6, dbService) => {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const code = urlUtils.generateShortCode(length);

      // Check if code exists in database
      const query = "SELECT id FROM urls WHERE short_code = $1";
      const result = await dbService.query(query, [code]);

      if (result.rows.length === 0) {
        return code;
      }

      attempts++;
      // Increase length after 5 attempts
      if (attempts >= 5) {
        length += 1;
      }
    }

    // Fallback: use timestamp-based code
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  },

  // Validate URL format
  validateUrl: (url) => {
    // Parameters: url (string)
    // Returns: boolean
    // Validates URL using regex
    return validator.isURL(url, {
      protocols: ["http", "https"],
      require_protocol: true,
      allow_underscores: true,
      host_whitelist: false,
      host_blacklist: false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
      disallow_auth: false,
    });
  },

  // Normalize URL
  normalizeUrl: (url) => {
    // Parameters: url (string)
    // Returns: normalizedUrl (string)
    // Normalizes URL (adds protocol, removes trailing slashes)
    let normalized = url.trim();

    // Add protocol if missing
    if (
      !normalized.startsWith("http://") &&
      !normalized.startsWith("https://")
    ) {
      normalized = "https://" + normalized;
    }

    // Remove trailing slash
    while (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  },

  // Extract domain
  extractDomain: (url) => {
    // Parameters: url (string)
    // Returns: domain (string)
    // Extracts domain from URL
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname;
    } catch (error) {
      return null;
    }
  },

  // Check URL against blacklist
  checkDomainBlacklist: async (url, dbService) => {
    // Parameters: url (string)
    // Returns: { isBlacklisted, reason }
    // Checks domain against blacklist
    try {
      const domain = urlUtils.extractDomain(url);
      if (!domain) {
        return { isBlacklisted: false, reason: null };
      }

      const query =
        "SELECT * FROM domain_blacklist WHERE domain = $1 AND (expires_at IS NULL OR expires_at > NOW())";
      const result = await dbService.query(query, [domain]);

      if (result.rows.length > 0) {
        return {
          isBlacklisted: true,
          reason: result.rows[0].reason || "Domain is blacklisted",
        };
      }

      // Check for subdomain wildcards
      const domainParts = domain.split(".");
      for (let i = 0; i < domainParts.length - 1; i++) {
        const wildcardDomain = "*." + domainParts.slice(i + 1).join(".");
        const wildcardResult = await dbService.query(query, [wildcardDomain]);
        if (wildcardResult.rows.length > 0) {
          return {
            isBlacklisted: true,
            reason: wildcardResult.rows[0].reason || "Domain is blacklisted",
          };
        }
      }

      return { isBlacklisted: false, reason: null };
    } catch (error) {
      return { isBlacklisted: false, reason: null };
    }
  },

  // Generate UTM parameters
  generateUtmParams: (source, medium, campaign) => {
    // Parameters: source (string), medium (string), campaign (string)
    // Returns: utmParams (object)
    // Creates UTM tracking parameters
    const params = {};
    if (source) params.utm_source = source;
    if (medium) params.utm_medium = medium;
    if (campaign) params.utm_campaign = campaign;
    return params;
  },

  // Parse tags
  parseTags: (tagsString) => {
    // Parameters: tagsString (string)
    // Returns: tagsArray (array)
    // Parses comma-separated tags
    if (!tagsString) return [];
    return tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  },

  // Get URL metadata
  fetchUrlMetadata: async (url) => {
    // Parameters: url (string)
    // Returns: { title, description, image }
    // Fetches metadata from URL
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        maxRedirects: 5,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const html = response.data;
      const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "";
      const description =
        html.match(
          /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
        )?.[1] || "";
      const image =
        html.match(
          /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i
        )?.[1] || "";

      return {
        title: title.trim(),
        description: description.trim(),
        image: image.trim(),
      };
    } catch (error) {
      return {
        title: "",
        description: "",
        image: "",
      };
    }
  },

  // Short code validation
  isValidShortCode: (code) => {
    // Parameters: code (string)
    // Returns: boolean
    // Validates short code format
    return /^[a-zA-Z0-9_-]{3,20}$/.test(code);
  },

  // Generate QR code
  generateQrCode: async (url, size = 300) => {
    // Parameters: url (string), size (integer)
    // Returns: qrCodeDataUrl (string)
    // Generates QR code image data
    try {
      const QRCode = require("qrcode");
      const qrCodeDataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        type: "image/png",
        quality: 0.92,
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error("Failed to generate QR code: " + error.message);
    }
  },

  // Sanitize URL for storage
  sanitizeUrl: (url) => {
    // Parameters: url (string)
    // Returns: sanitizedUrl (string)
    // Sanitizes URL to prevent XSS and injection
    return url
      .replace(/[<>"']/g, "") // Remove potentially dangerous characters
      .trim();
  },

  // Check if URL is valid and accessible
  checkUrlAccessibility: async (url) => {
    // Parameters: url (string)
    // Returns: { accessible, statusCode, error }
    // Checks if URL is accessible
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        maxRedirects: 5,
      });
      return {
        accessible: response.status >= 200 && response.status < 400,
        statusCode: response.status,
        error: null,
      };
    } catch (error) {
      return {
        accessible: false,
        statusCode: error.response?.status || null,
        error: error.message,
      };
    }
  },

  // Generate random string for custom code suggestions
  generateSuggestion: (length = 8) => {
    // Parameters: length (integer)
    // Returns: suggestion (string)
    // Generates random string for custom code suggestions
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Parse URL expiration
  parseExpiration: (expirationStr) => {
    // Parameters: expirationStr (string)
    // Returns: expirationDate (Date)
    // Parses expiration string (e.g., '1d', '2h', '30m')
    const units = {
      d: 86400000,
      h: 3600000,
      m: 60000,
      s: 1000,
    };

    const match = expirationStr.match(/^(\d+)([dhms])$/);
    if (!match) return null;

    const value = parseInt(match[1]);
    const unit = match[2];

    if (!units[unit] || value <= 0) return null;

    const milliseconds = value * units[unit];
    return new Date(Date.now() + milliseconds);
  },

  // Format URL response
  formatUrlResponse: (url) => {
    // Parameters: url (object)
    // Returns: formattedUrl (object)
    // Formats URL for API response
    return {
      id: url.id,
      short_code: url.short_code,
      original_url: url.original_url,
      title: url.title,
      description: url.description,
      tags: url.tags,
      click_count: url.click_count,
      is_active: url.is_active,
      requires_password: url.requires_password,
      expires_at: url.expires_at,
      last_clicked_at: url.last_clicked_at,
      status: url.status,
      utm_source: url.utm_source,
      utm_medium: url.utm_medium,
      utm_campaign: url.utm_campaign,
      created_at: url.created_at,
      updated_at: url.updated_at,
      short_url: `${process.env.BASE_URL}/${url.short_code}`,
      qr_code_url: `${process.env.BASE_URL}/api/v1/qr/${url.id}`,
    };
  },
};

module.exports = urlUtils;
