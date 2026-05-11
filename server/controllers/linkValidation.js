import { createRequestContextLogger } from "../utils/logger.js";
import { BadRequestError } from "../errors/customErrors.js";
import axios from "axios";

export class LinkValidationController {
  /**
   * Validate original URL
   */
  static async validateUrl(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { url } = req.body;

      if (!url) {
        throw new BadRequestError("URL is required");
      }

      // Validate URL format
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch (error) {
        throw new BadRequestError(
          "Invalid URL format. Please include http:// or https://"
        );
      }

      // Check if URL is reachable
      const reachable = await this.checkUrlReachability(url);

      // Check for malicious content (if Safe Browsing API enabled)
      let isMalicious = false;
      let threatType = null;

      if (process.env.GOOGLE_SAFE_BROWSING_API_KEY) {
        const safetyCheck = await this.checkMaliciousUrl(url);
        isMalicious = safetyCheck.isMalicious;
        threatType = safetyCheck.threatType;
      }

      // Validate URL length
      const isValidLength = url.length <= 2048;

      // Check for redirect chains
      const redirectChain = await this.getRedirectChain(url);

      const validationResult = {
        isValid: true,
        format: {
          isValid: true,
          protocol: parsedUrl.protocol,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
          path: parsedUrl.pathname,
        },
        reachable,
        isMalicious,
        threatType,
        isValidLength,
        redirectChain: redirectChain.length > 1 ? redirectChain : null,
        warnings: this.getWarnings(url, parsedUrl, reachable),
        suggestions: this.getSuggestions(url, parsedUrl),
      };

      if (isMalicious) {
        validationResult.isValid = false;
        validationResult.error =
          "This URL has been flagged as potentially malicious";
      }

      if (!reachable) {
        validationResult.warnings.push("URL appears to be unreachable");
      }

      if (!isValidLength) {
        validationResult.warnings.push(
          "URL exceeds recommended length of 2048 characters"
        );
      }

      log.business("url_validated", {
        url: parsedUrl.hostname,
        isValid: validationResult.isValid,
        isMalicious,
      });

      log.performance("validate_url", Date.now() - startTime);

      res.json({
        success: true,
        data: validationResult,
      });
    } catch (error) {
      log.error(error, { action: "validate_url" });
      next(error);
    }
  }

  /**
   * Bulk validate URLs
   */
  static async bulkValidateUrls(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { urls } = req.body;

      if (!Array.isArray(urls) || urls.length === 0) {
        throw new BadRequestError("Please provide an array of URLs");
      }

      if (urls.length > 50) {
        throw new BadRequestError("Maximum 50 URLs per batch");
      }

      const validationResults = await Promise.all(
        urls.map(async (url) => {
          try {
            const result = await this.validateSingleUrl(url);
            return { url, ...result };
          } catch (error) {
            return { url, isValid: false, error: error.message };
          }
        })
      );

      const summary = {
        total: validationResults.length,
        valid: validationResults.filter((r) => r.isValid).length,
        invalid: validationResults.filter((r) => !r.isValid).length,
        malicious: validationResults.filter((r) => r.isMalicious).length,
      };

      log.performance("bulk_validate_urls", Date.now() - startTime);

      res.json({
        success: true,
        data: validationResults,
        summary,
      });
    } catch (error) {
      log.error(error, { action: "bulk_validate_urls" });
      next(error);
    }
  }

  /**
   * Check URL safety with Google Safe Browsing
   */
  static async checkUrlSafety(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { url } = req.body;

      if (!url) {
        throw new BadRequestError("URL is required");
      }

      if (!process.env.GOOGLE_SAFE_BROWSING_API_KEY) {
        throw new BadRequestError("Safe Browsing API not configured");
      }

      const safetyResult = await this.checkMaliciousUrl(url);

      log.business("url_safety_checked", {
        url,
        isMalicious: safetyResult.isMalicious,
      });

      log.performance("check_url_safety", Date.now() - startTime);

      res.json({
        success: true,
        data: safetyResult,
      });
    } catch (error) {
      log.error(error, { action: "check_url_safety" });
      next(error);
    }
  }

  // Helper methods
  static async checkUrlReachability(url, timeout = 5000) {
    try {
      const response = await axios.head(url, { timeout });
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      try {
        // Try GET if HEAD fails
        const response = await axios.get(url, {
          timeout,
          maxRedirects: 5,
          validateStatus: (status) => status < 400,
        });
        return true;
      } catch {
        return false;
      }
    }
  }

  static async checkMaliciousUrl(url) {
    if (!process.env.GOOGLE_SAFE_BROWSING_API_KEY) {
      return { isMalicious: false, threatType: null };
    }

    try {
      const response = await axios.post(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_API_KEY}`,
        {
          client: {
            clientId: "url-shortener",
            clientVersion: "1.0.0",
          },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }
      );

      if (response.data.matches && response.data.matches.length > 0) {
        return {
          isMalicious: true,
          threatType: response.data.matches[0].threatType,
          platformType: response.data.matches[0].platformType,
        };
      }

      return { isMalicious: false, threatType: null };
    } catch (error) {
      console.error("Safe Browsing API error:", error.message);
      return { isMalicious: false, threatType: null, error: error.message };
    }
  }

  static async getRedirectChain(url, maxRedirects = 5) {
    const chain = [url];
    let currentUrl = url;

    try {
      for (let i = 0; i < maxRedirects; i++) {
        const response = await axios.head(currentUrl, {
          maxRedirects: 0,
          validateStatus: (status) => status >= 300 && status < 400,
        });

        if (response.headers.location) {
          const nextUrl = new URL(response.headers.location, currentUrl).href;
          if (chain.includes(nextUrl)) {
            break; // Circular redirect detected
          }
          chain.push(nextUrl);
          currentUrl = nextUrl;
        } else {
          break;
        }
      }
    } catch (error) {
      // If HEAD fails, try GET
      try {
        const response = await axios.get(currentUrl, { maxRedirects: 0 });
        if (response.headers.location) {
          const nextUrl = new URL(response.headers.location, currentUrl).href;
          chain.push(nextUrl);
        }
      } catch {
        // Ignore errors
      }
    }

    return chain;
  }

  static getWarnings(url, parsedUrl, reachable) {
    const warnings = [];

    if (!reachable) {
      warnings.push("URL may be down or unreachable");
    }

    if (parsedUrl.protocol !== "https:") {
      warnings.push("URL does not use HTTPS, which may not be secure");
    }

    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      warnings.push("Localhost URLs are not allowed");
    }

    const suspiciousPatterns = [
      /bit\.ly/i,
      /tinyurl\.com/i,
      /goo\.gl/i,
      /ow\.ly/i,
      /short\.link/i,
      /is\.gd/i,
      /buff\.ly/i,
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(url))) {
      warnings.push("URL appears to be using another URL shortener");
    }

    return warnings;
  }

  static getSuggestions(url, parsedUrl) {
    const suggestions = [];

    if (parsedUrl.protocol !== "https:") {
      const httpsUrl = url.replace("http://", "https://");
      suggestions.push(`Consider using HTTPS: ${httpsUrl}`);
    }

    if (parsedUrl.hostname.includes("www.")) {
      const withoutWww = url.replace("www.", "");
      suggestions.push(`Consider removing www: ${withoutWww}`);
    }

    if (parsedUrl.pathname === "/" || parsedUrl.pathname === "") {
      suggestions.push("Add specific path for better tracking");
    }

    return suggestions;
  }

  static async validateSingleUrl(url) {
    try {
      const parsedUrl = new URL(url);
      const reachable = await this.checkUrlReachability(url);
      const isMalicious = await this.checkMaliciousUrl(url);

      return {
        isValid: !isMalicious.isMalicious,
        reachable,
        isMalicious: isMalicious.isMalicious,
        threatType: isMalicious.threatType,
        hostname: parsedUrl.hostname,
        protocol: parsedUrl.protocol,
      };
    } catch (error) {
      throw new Error("Invalid URL format");
    }
  }
}
