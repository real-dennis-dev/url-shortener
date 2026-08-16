const csv = require("csv-parser");
const { Readable } = require("stream");
const XLSX = require("xlsx");
const shortid = require("shortid");
const { promisify } = require("util");
const streamToBuffer = require("stream-to-buffer");

const bulkUploadUtils = {
  /**
   * Parse CSV file
   */
  parseCSV: (csvData) => {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from([csvData]);

      stream
        .pipe(csv())
        .on("data", (data) => {
          // Clean up column names
          const cleanData = {};
          Object.keys(data).forEach((key) => {
            const cleanKey = key.trim().toLowerCase();
            if (cleanKey === "url") {
              cleanData[cleanKey] = data[key]?.trim() || "";
            } else if (["title", "description", "tags"].includes(cleanKey)) {
              cleanData[cleanKey] = data[key]?.trim() || "";
            }
          });

          // Only add if url exists
          if (cleanData.url) {
            results.push(cleanData);
          }
        })
        .on("end", () => {
          resolve(results);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  },

  /**
   * Parse Excel file
   */
  parseExcel: (buffer) => {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet);

      // Clean up data
      const cleanedData = data
        .map((row) => {
          const cleanRow = {};
          Object.keys(row).forEach((key) => {
            const cleanKey = key.trim().toLowerCase();
            if (cleanKey === "url") {
              cleanRow[cleanKey] = row[key]?.toString().trim() || "";
            } else if (["title", "description", "tags"].includes(cleanKey)) {
              cleanRow[cleanKey] = row[key]?.toString().trim() || "";
            }
          });
          return cleanRow;
        })
        .filter((row) => row.url);

      return cleanedData;
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  },

  /**
   * Validate URL entry
   */
  validateUrlEntry: (entry) => {
    const errors = [];

    // Validate URL
    if (!entry.url) {
      errors.push("URL is required");
    } else {
      try {
        const url = new URL(entry.url);
        if (!["http:", "https:"].includes(url.protocol)) {
          errors.push("URL must use HTTP or HTTPS protocol");
        }
      } catch {
        errors.push("Invalid URL format");
      }
    }

    // Validate title length
    if (entry.title && entry.title.length > 500) {
      errors.push("Title exceeds maximum length of 500 characters");
    }

    // Validate description length
    if (entry.description && entry.description.length > 1000) {
      errors.push("Description exceeds maximum length of 1000 characters");
    }

    // Validate tags
    if (entry.tags) {
      const tags = entry.tags.split(",").map((t) => t.trim());
      if (tags.length > 20) {
        errors.push("Maximum 20 tags allowed");
      }
      if (tags.some((t) => t.length > 50)) {
        errors.push("Each tag must be less than 50 characters");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Chunk array for processing
   */
  chunkArray: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Generate error report
   */
  generateErrorReport: (errors) => {
    if (!errors || errors.length === 0) {
      return "No errors found";
    }

    let report = "=== Bulk Upload Error Report ===\n\n";
    report += `Total Errors: ${errors.length}\n\n`;
    report += "Detailed Errors:\n";
    report += "───────────────────\n\n";

    errors.forEach((error, index) => {
      report += `Error #${index + 1}\n`;
      report += `Row: ${error.row || "N/A"}\n`;
      if (error.url) {
        report += `URL: ${error.url}\n`;
      }
      if (error.errors) {
        report += `Errors: ${error.errors.join(", ")}\n`;
      }
      if (error.error) {
        report += `Error: ${error.error}\n`;
      }
      report += "\n";
    });

    return report;
  },

  /**
   * Generate CSV template
   */
  generateCSV: (data) => {
    const headers = ["url", "title", "description", "tags"];
    let csv = headers.join(",") + "\n";

    data.forEach((row) => {
      const values = headers.map((header) => {
        let value = row[header] || "";
        // Escape quotes and wrap in quotes if contains comma
        if (
          value.includes(",") ||
          value.includes('"') ||
          value.includes("\n")
        ) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += values.join(",") + "\n";
    });

    return csv;
  },

  /**
   * Generate Excel template
   */
  generateExcel: (data) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const colWidths = [
      { wch: 40 }, // url
      { wch: 30 }, // title
      { wch: 40 }, // description
      { wch: 25 }, // tags
    ];
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Bulk Upload Template");

    // Convert to buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  },

  /**
   * Generate short code
   */
  generateShortCode: (length) => {
    return shortid.generate().substring(0, length);
  },

  /**
   * Validate file type
   */
  validateFileType: (mimetype, originalname) => {
    const allowedMimes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    const allowedExtensions = [".csv", ".xlsx", ".xls"];

    if (!allowedMimes.includes(mimetype)) {
      return false;
    }

    const ext = originalname
      .toLowerCase()
      .substring(originalname.lastIndexOf("."));
    return allowedExtensions.includes(ext);
  },

  /**
   * Get file size in human readable format
   */
  getFileSize: (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Estimate processing time
   */
  estimateProcessingTime: (totalUrls) => {
    // Average processing time: 100 URLs per second
    const avgTimePerUrl = 0.01; // seconds
    const estimatedSeconds = totalUrls * avgTimePerUrl;

    if (estimatedSeconds < 60) {
      return `${Math.ceil(estimatedSeconds)} seconds`;
    } else if (estimatedSeconds < 3600) {
      return `${Math.ceil(estimatedSeconds / 60)} minutes`;
    } else {
      return `${Math.ceil(estimatedSeconds / 3600)} hours`;
    }
  },
};

module.exports = bulkUploadUtils;
