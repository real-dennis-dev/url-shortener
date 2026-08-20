// src/modules/api-logs/utils.js
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");

const apiLogUtils = {
  /**
   * Anonymize sensitive data
   * Replaces sensitive information with placeholders
   */
  anonymizeSensitiveData: (data) => {
    if (!data) return null;

    let str = typeof data === "string" ? data : JSON.stringify(data);

    // Anonymize email addresses
    str = str.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[EMAIL]"
    );

    // Anonymize phone numbers (various formats)
    str = str.replace(/\+?[\d\s-]{10,15}/g, "[PHONE]");

    // Anonymize IP addresses
    str = str.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP]");

    // Anonymize credit card numbers
    str = str.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, "[CARD]");

    // Anonymize passwords (anything after password or pass in JSON)
    str = str.replace(/"password":\s*"[^"]*"/g, '"password":"[REDACTED]"');
    str = str.replace(/"pass":\s*"[^"]*"/g, '"pass":"[REDACTED]"');
    str = str.replace(/"token":\s*"[^"]*"/g, '"token":"[REDACTED]"');
    str = str.replace(/"api_key":\s*"[^"]*"/g, '"api_key":"[REDACTED]"');
    str = str.replace(/"secret":\s*"[^"]*"/g, '"secret":"[REDACTED]"');

    // Anonymize authorization headers
    str = str.replace(
      /Authorization:\s*Bearer\s+[^\s]+/gi,
      "Authorization: Bearer [REDACTED]"
    );

    return str;
  },

  /**
   * Format log for export
   * Formats log entry for different export formats
   */
  formatLogForExport: (logs, format) => {
    // Prepare data for export
    const exportData = logs.map((log) => ({
      id: log.id,
      userId: log.user_id || "anonymous",
      userEmail: log.user_email || "N/A",
      userName: log.user_name || "N/A",
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.status_code,
      responseTime: log.response_time,
      ip: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
    }));

    switch (format) {
      case "csv":
        return apiLogUtils.exportToCSV(exportData);
      case "excel":
        return apiLogUtils.exportToExcel(exportData);
      case "json":
      default:
        return JSON.stringify(exportData, null, 2);
    }
  },

  /**
   * Export to CSV
   */
  exportToCSV: (data) => {
    if (data.length === 0) {
      return "";
    }

    try {
      const fields = Object.keys(data[0]);
      const parser = new Parser({ fields });
      return parser.parse(data);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      throw new Error("Failed to export logs to CSV");
    }
  },

  /**
   * Export to Excel
   */
  exportToExcel: async (data) => {
    if (data.length === 0) {
      return Buffer.from("");
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("API Logs");

      // Add headers
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);

      // Style headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };

      // Add data
      data.forEach((item) => {
        const row = headers.map((header) => {
          let value = item[header];
          // Format dates
          if (header === "createdAt" && value) {
            value = new Date(value).toLocaleString();
          }
          return value !== undefined && value !== null ? value : "";
        });
        worksheet.addRow(row);
      });

      // Auto-size columns
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : "";
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      throw new Error("Failed to export logs to Excel");
    }
  },

  /**
   * Calculate response time
   * Calculates response time in milliseconds
   */
  calculateResponseTime: (startTime, endTime) => {
    if (!startTime || !endTime) {
      return 0;
    }

    const start =
      typeof startTime === "number" ? startTime : new Date(startTime).getTime();
    const end =
      typeof endTime === "number" ? endTime : new Date(endTime).getTime();

    return Math.max(0, end - start);
  },

  /**
   * Get log level from status code
   */
  getLogLevel: (statusCode) => {
    if (statusCode >= 500) return "error";
    if (statusCode >= 400) return "warning";
    if (statusCode >= 300) return "info";
    return "debug";
  },

  /**
   * Sanitize endpoint for display
   */
  sanitizeEndpoint: (endpoint) => {
    if (!endpoint) return "";

    // Remove query parameters
    return endpoint.split("?")[0];
  },

  /**
   * Get method color for display
   */
  getMethodColor: (method) => {
    const colors = {
      GET: "#4CAF50",
      POST: "#2196F3",
      PUT: "#FF9800",
      DELETE: "#F44336",
      PATCH: "#9C27B0",
    };
    return colors[method] || "#607D8B";
  },

  /**
   * Parse user agent for display
   */
  parseUserAgentForDisplay: (userAgent) => {
    if (!userAgent) return "Unknown";

    // Simple browser detection
    let browser = "Unknown";
    let os = "Unknown";

    if (userAgent.includes("Chrome")) browser = "Chrome";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Safari")) browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Edge";
    else if (userAgent.includes("Opera")) browser = "Opera";

    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac OS")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iOS")) os = "iOS";

    return `${browser} on ${os}`;
  },
};

module.exports = apiLogUtils;
