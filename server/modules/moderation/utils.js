// src/modules/moderation/utils.js
const axios = require("axios");
const { URL } = require("url");
const DatabaseService = require("../../services/database.service");

const moderationUtils = {
  /**
   * Check URL against blacklist
   */
  checkDomainBlacklist: async (url) => {
    try {
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;

      const db = new DatabaseService();
      const result = await db.executeQuery(
        "SELECT * FROM domain_blacklist WHERE domain = $1 AND (expires_at IS NULL OR expires_at > NOW())",
        [domain]
      );

      if (result && result.length > 0) {
        return {
          isBlacklisted: true,
          reason: result[0].reason,
          entry: result[0],
        };
      }

      // Check subdomain blacklist
      const domainParts = domain.split(".");
      for (let i = 0; i < domainParts.length - 1; i++) {
        const subdomain = domainParts.slice(i).join(".");
        const subResult = await db.executeQuery(
          "SELECT * FROM domain_blacklist WHERE domain = $1 AND (expires_at IS NULL OR expires_at > NOW())",
          [subdomain]
        );
        if (subResult && subResult.length > 0) {
          return {
            isBlacklisted: true,
            reason: `Parent domain in blacklist: ${subdomain}`,
            entry: subResult[0],
          };
        }
      }

      return {
        isBlacklisted: false,
        reason: null,
      };
    } catch (error) {
      console.error("Error checking domain blacklist:", error);
      return {
        isBlacklisted: false,
        reason: null,
        error: error.message,
      };
    }
  },

  /**
   * Scan URL for malware using external APIs
   */
  scanUrlForMalware: async (url) => {
    try {
      // Check with VirusTotal API
      if (process.env.VIRUSTOTAL_API_KEY) {
        const vtResponse = await axios.post(
          "https://www.virustotal.com/api/v3/urls",
          new URLSearchParams({ url }),
          {
            headers: {
              "x-apikey": process.env.VIRUSTOTAL_API_KEY,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        const scanId = vtResponse.data.data.id;

        // Wait for scan results (with retry)
        let attempts = 0;
        let scanResult = null;

        while (attempts < 5) {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const resultResponse = await axios.get(
            `https://www.virustotal.com/api/v3/analyses/${scanId}`,
            {
              headers: {
                "x-apikey": process.env.VIRUSTOTAL_API_KEY,
              },
            }
          );

          scanResult = resultResponse.data;
          if (scanResult.data.attributes.status === "completed") {
            break;
          }
          attempts++;
        }

        if (scanResult) {
          const stats = scanResult.data.attributes.stats;
          const threats = [];

          if (stats.malicious > 0) threats.push("Malicious content detected");
          if (stats.suspicious > 3) threats.push("Suspicious content detected");
          if (stats.undetected > 20) threats.push("Uncommon content detected");

          return {
            safe: stats.malicious === 0 && stats.suspicious < 3,
            threats,
            stats,
          };
        }
      }

      // Check with Google Safe Browsing API
      if (process.env.GOOGLE_SAFE_BROWSING_API_KEY) {
        const gsbResponse = await axios.post(
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

        if (gsbResponse.data.matches && gsbResponse.data.matches.length > 0) {
          return {
            safe: false,
            threats: gsbResponse.data.matches.map((m) => m.threatType),
            platform: "google-safebrowsing",
          };
        }
      }

      return {
        safe: true,
        threats: [],
      };
    } catch (error) {
      console.error("Error scanning URL for malware:", error);
      return {
        safe: true,
        threats: [],
        error: error.message,
      };
    }
  },

  /**
   * Validate URL content for prohibited content
   */
  validateUrlContent: async (url) => {
    try {
      const issues = [];
      const parsedUrl = new URL(url);

      // Check for common prohibited keywords
      const prohibitedKeywords = [
        "hack",
        "crack",
        "warez",
        "porn",
        "xxx",
        "adult",
        "drug",
        "pharma",
        "casino",
        "gambling",
        "bet",
        "viagra",
        "cialis",
        "bitcoin",
        "crypto",
      ];

      const urlLower = url.toLowerCase();
      const domainLower = parsedUrl.hostname.toLowerCase();

      for (const keyword of prohibitedKeywords) {
        if (urlLower.includes(keyword) || domainLower.includes(keyword)) {
          issues.push(`Contains prohibited keyword: ${keyword}`);
        }
      }

      // Check for IP address usage
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (ipRegex.test(parsedUrl.hostname)) {
        issues.push("Uses IP address instead of domain name");
      }

      // Check for URL shortener chains
      const knownShorteners = [
        "bit.ly",
        "tinyurl.com",
        "goo.gl",
        "t.co",
        "ow.ly",
        "is.gd",
        "buff.ly",
      ];
      if (knownShorteners.some((s) => domainLower.includes(s))) {
        issues.push("Uses known URL shortener service");
      }

      // Check for unusual URL length
      if (url.length > 2000) {
        issues.push("Excessively long URL");
      }

      return {
        valid: issues.length === 0,
        issues,
        score: Math.max(0, 100 - issues.length * 10),
      };
    } catch (error) {
      console.error("Error validating URL content:", error);
      return {
        valid: false,
        issues: ["Invalid URL format"],
        score: 0,
      };
    }
  },

  /**
   * Detect spam patterns in URL data
   */
  detectSpamPatterns: (url, title = "", description = "") => {
    try {
      const reasons = [];
      let confidence = 0;
      const parsedUrl = new URL(url);

      // Check for excessive special characters
      const specialChars = (url.match(/[!@#$%^&*()_+{}|:"<>?]/g) || []).length;
      if (specialChars > 10) {
        reasons.push("Excessive special characters");
        confidence += 0.2;
      }

      // Check for suspicious keywords in title
      const suspiciousKeywords = [
        "free",
        "money",
        "win",
        "prize",
        "click here",
        "sign up",
        "earn",
        "cash",
        "discount",
        "offer",
        "limited time",
      ];

      const titleLower = title.toLowerCase();
      for (const keyword of suspiciousKeywords) {
        if (titleLower.includes(keyword)) {
          reasons.push(`Suspicious keyword in title: "${keyword}"`);
          confidence += 0.1;
          break;
        }
      }

      // Check for excessive capitalization
      const capsCount = (title.match(/[A-Z]/g) || []).length;
      if (title.length > 0 && capsCount / title.length > 0.5) {
        reasons.push("Excessive capitalization in title");
        confidence += 0.15;
      }

      // Check for multiple subdomains
      const subdomainCount = parsedUrl.hostname.split(".").length - 2;
      if (subdomainCount > 3) {
        reasons.push(`Multiple subdomains (${subdomainCount})`);
        confidence += 0.1;
      }

      // Check for suspicious query parameters
      const suspiciousParams = [
        "ref",
        "aff",
        "partner",
        "utm_source",
        "utm_medium",
        "campaign",
      ];
      const params = new URLSearchParams(parsedUrl.search);
      let suspiciousParamCount = 0;
      for (const param of suspiciousParams) {
        if (params.has(param)) {
          suspiciousParamCount++;
        }
      }
      if (suspiciousParamCount > 3) {
        reasons.push(
          `Multiple tracking/suspicious parameters (${suspiciousParamCount})`
        );
        confidence += 0.15;
      }

      // Check for numeric-only domains
      if (/^\d+$/.test(parsedUrl.hostname.replace(/\./g, ""))) {
        reasons.push("Numeric-only domain");
        confidence += 0.2;
      }

      // Check for very short domain
      if (parsedUrl.hostname.length < 6) {
        reasons.push("Very short domain name");
        confidence += 0.1;
      }

      return {
        isSpam: confidence > 0.5,
        confidence: Math.min(confidence, 1),
        reasons,
      };
    } catch (error) {
      console.error("Error detecting spam patterns:", error);
      return {
        isSpam: false,
        confidence: 0,
        reasons: ["Error analyzing URL"],
      };
    }
  },

  /**
   * Generate moderation report
   */
  generateModerationReport: (urlData) => {
    const report = {
      url: urlData.original_url,
      shortCode: urlData.short_code,
      title: urlData.title || "",
      description: urlData.description || "",
      created: urlData.created_at,
      status: urlData.status,
      moderationHistory: [],
      riskScore: 0,
      riskLevel: "low",
      findings: [],
    };

    // Analyze URL components
    try {
      const parsedUrl = new URL(urlData.original_url);
      report.domain = parsedUrl.hostname;
      report.pathLength = parsedUrl.pathname.length;
      report.hasQueryParams = parsedUrl.search.length > 0;
      report.subdomainCount = parsedUrl.hostname.split(".").length - 2;

      // Check for suspicious patterns
      if (report.pathLength > 100) {
        report.findings.push("Long path structure");
        report.riskScore += 10;
      }

      if (report.subdomainCount > 3) {
        report.findings.push("Multiple subdomains");
        report.riskScore += 15;
      }

      if (!report.hasQueryParams) {
        report.findings.push("No query parameters");
        report.riskScore += 5;
      }

      // Check title and description
      if (report.title && report.title.length === 0) {
        report.findings.push("Missing title");
        report.riskScore += 5;
      }

      if (report.description && report.description.length === 0) {
        report.findings.push("Missing description");
        report.riskScore += 5;
      }

      // Check for suspicious keywords
      const suspiciousKeywords = [
        "free",
        "money",
        "win",
        "prize",
        "click",
        "earn",
        "cash",
      ];
      const content = (report.title + " " + report.description).toLowerCase();
      for (const keyword of suspiciousKeywords) {
        if (content.includes(keyword)) {
          report.findings.push(`Contains keyword: "${keyword}"`);
          report.riskScore += 10;
        }
      }

      // Determine risk level
      if (report.riskScore >= 40) {
        report.riskLevel = "high";
      } else if (report.riskScore >= 20) {
        report.riskLevel = "medium";
      } else {
        report.riskLevel = "low";
      }
    } catch (error) {
      report.findings.push("Invalid URL format");
      report.riskScore = 100;
      report.riskLevel = "high";
    }

    return report;
  },
};

module.exports = moderationUtils;
