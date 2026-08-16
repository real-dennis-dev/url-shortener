// src/modules/analytics/utils/analytics.utils.js
const UAParser = require("ua-parser-js");
const geoip = require("geoip-lite");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");

/**
 * Parse user agent
 */
const parseUserAgent = (userAgent) => {
  try {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    return {
      browser: result.browser.name || "Unknown",
      browserVersion: result.browser.version || "Unknown",
      os: result.os.name || "Unknown",
      osVersion: result.os.version || "Unknown",
      device: result.device.type || "desktop",
      deviceModel: result.device.model || "Unknown",
      deviceVendor: result.device.vendor || "Unknown",
    };
  } catch (error) {
    return {
      browser: "Unknown",
      browserVersion: "Unknown",
      os: "Unknown",
      osVersion: "Unknown",
      device: "desktop",
      deviceModel: "Unknown",
      deviceVendor: "Unknown",
    };
  }
};

/**
 * Get location from IP
 */
const getGeoLocation = (ip) => {
  try {
    // Don't process local IPs
    if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
      return {
        country: "Local",
        city: "Local",
        region: "Local",
        coordinates: null,
      };
    }

    const geo = geoip.lookup(ip);

    if (!geo) {
      return {
        country: "Unknown",
        city: "Unknown",
        region: "Unknown",
        coordinates: null,
      };
    }

    return {
      country: geo.country || "Unknown",
      city: geo.city || "Unknown",
      region: geo.region || "Unknown",
      coordinates: geo.ll
        ? {
            latitude: geo.ll[0],
            longitude: geo.ll[1],
          }
        : null,
    };
  } catch (error) {
    return {
      country: "Unknown",
      city: "Unknown",
      region: "Unknown",
      coordinates: null,
    };
  }
};

/**
 * Calculate bounce rate
 */
const calculateBounceRate = (sessionData) => {
  if (!sessionData || sessionData.length === 0) {
    return 0;
  }

  const sessions = sessionData.reduce((acc, click) => {
    if (!acc[click.session_id]) {
      acc[click.session_id] = [];
    }
    acc[click.session_id].push(click);
    return acc;
  }, {});

  let bounces = 0;
  let totalSessions = Object.keys(sessions).length;

  Object.values(sessions).forEach((clicks) => {
    if (clicks.length === 1) {
      bounces++;
    }
  });

  return totalSessions > 0 ? (bounces / totalSessions) * 100 : 0;
};

/**
 * Calculate average session duration
 */
const calculateAvgSessionDuration = (sessionData) => {
  if (!sessionData || sessionData.length === 0) {
    return 0;
  }

  const sessions = sessionData.reduce((acc, click) => {
    if (!acc[click.session_id]) {
      acc[click.session_id] = [];
    }
    acc[click.session_id].push(click);
    return acc;
  }, {});

  let totalDuration = 0;
  let sessionCount = 0;

  Object.values(sessions).forEach((clicks) => {
    if (clicks.length > 1) {
      const sortedClicks = clicks.sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
      const first = new Date(sortedClicks[0].created_at);
      const last = new Date(sortedClicks[sortedClicks.length - 1].created_at);
      const duration = (last - first) / 1000; // seconds
      totalDuration += duration;
      sessionCount++;
    }
  });

  return sessionCount > 0 ? Math.round(totalDuration / sessionCount) : 0;
};

/**
 * Aggregate clicks by time interval
 */
const aggregateByTimeInterval = (clicks, interval) => {
  if (!clicks || clicks.length === 0) {
    return [];
  }

  const aggregated = {};

  clicks.forEach((click) => {
    const date = new Date(click.created_at);
    let key;

    switch (interval) {
      case "hour":
        key = date.toISOString().slice(0, 13);
        break;
      case "day":
        key = date.toISOString().slice(0, 10);
        break;
      case "week":
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = startOfWeek.toISOString().slice(0, 10);
        break;
      case "month":
        key = date.toISOString().slice(0, 7);
        break;
      default:
        key = date.toISOString().slice(0, 10);
    }

    if (!aggregated[key]) {
      aggregated[key] = {
        count: 0,
        unique: new Set(),
      };
    }

    aggregated[key].count++;
    if (click.ip_address) {
      aggregated[key].unique.add(click.ip_address);
    }
  });

  return Object.entries(aggregated)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, data]) => ({
      key,
      count: data.count,
      unique: data.unique.size,
    }));
};

/**
 * Format analytics for export
 */
const formatForExport = (data, format) => {
  try {
    switch (format) {
      case "csv":
        return _formatToCSV(data);
      case "json":
        return JSON.stringify(data, null, 2);
      case "excel":
        return _formatToExcel(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  } catch (error) {
    throw new Error(`Failed to format data for export: ${error.message}`);
  }
};

/**
 * Format to CSV
 */
const _formatToCSV = (data) => {
  // Prepare flattened data for CSV
  const flatData = [];

  // Add summary
  flatData.push({
    type: "SUMMARY",
    key: "totalClicks",
    value: data.summary.totalClicks,
  });
  flatData.push({
    type: "SUMMARY",
    key: "uniqueVisitors",
    value: data.summary.uniqueVisitors,
  });
  flatData.push({
    type: "SUMMARY",
    key: "devices",
    value: data.summary.devices,
  });

  // Add timeline data
  data.timeline.forEach((item) => {
    flatData.push({
      type: "TIMELINE",
      key: item.date,
      value: item.count,
    });
  });

  // Add device data
  data.devices.forEach((item) => {
    flatData.push({
      type: "DEVICE",
      key: item.name,
      value: item.value,
    });
  });

  // Add browser data
  data.browsers.forEach((item) => {
    flatData.push({
      type: "BROWSER",
      key: item.name,
      value: item.value,
    });
  });

  // Add country data
  data.countries.forEach((item) => {
    flatData.push({
      type: "COUNTRY",
      key: item.name,
      value: item.value,
    });
  });

  // Add referrer data
  data.referrers.forEach((item) => {
    flatData.push({
      type: "REFERRER",
      key: item.name,
      value: item.value,
    });
  });

  // Convert to CSV
  const parser = new Parser();
  return parser.parse(flatData);
};

/**
 * Format to Excel
 */
const _formatToExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();

  // Create summary sheet
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.addRow(["Metric", "Value"]);
  summarySheet.addRow(["Total Clicks", data.summary.totalClicks]);
  summarySheet.addRow(["Unique Visitors", data.summary.uniqueVisitors]);
  summarySheet.addRow(["Devices", data.summary.devices]);
  summarySheet.addRow(["Browsers", data.summary.browsers]);
  summarySheet.addRow(["Countries", data.summary.countries]);
  summarySheet.addRow(["Referrers", data.summary.referrers]);

  // Create timeline sheet
  const timelineSheet = workbook.addWorksheet("Timeline");
  timelineSheet.addRow(["Date", "Clicks"]);
  data.timeline.forEach((item) => {
    timelineSheet.addRow([item.date, item.count]);
  });

  // Create devices sheet
  const devicesSheet = workbook.addWorksheet("Devices");
  devicesSheet.addRow(["Device", "Clicks"]);
  data.devices.forEach((item) => {
    devicesSheet.addRow([item.name, item.value]);
  });

  // Create browsers sheet
  const browsersSheet = workbook.addWorksheet("Browsers");
  browsersSheet.addRow(["Browser", "Clicks"]);
  data.browsers.forEach((item) => {
    browsersSheet.addRow([item.name, item.value]);
  });

  // Create countries sheet
  const countriesSheet = workbook.addWorksheet("Countries");
  countriesSheet.addRow(["Country", "Clicks"]);
  data.countries.forEach((item) => {
    countriesSheet.addRow([item.name, item.value]);
  });

  // Create referrers sheet
  const referrersSheet = workbook.addWorksheet("Referrers");
  referrersSheet.addRow(["Referrer", "Clicks"]);
  data.referrers.forEach((item) => {
    referrersSheet.addRow([item.name, item.value]);
  });

  // Create recent clicks sheet
  const recentClicksSheet = workbook.addWorksheet("Recent Clicks");
  recentClicksSheet.addRow([
    "Time",
    "Device",
    "Browser",
    "Country",
    "Referrer",
  ]);
  data.recentClicks.forEach((click) => {
    recentClicksSheet.addRow([
      click.created_at,
      click.device_type || "Unknown",
      click.browser || "Unknown",
      click.country || "Unknown",
      click.referrer_domain || "Direct",
    ]);
  });

  // Generate buffer
  return await workbook.xlsx.writeBuffer();
};

/**
 * Detect bot traffic
 */
const detectBotTraffic = (userAgent) => {
  if (!userAgent) return false;

  const botPatterns = [
    /bot/i,
    /crawl/i,
    /spider/i,
    /scrape/i,
    /headless/i,
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /pinterestbot/i,
    /slackbot/i,
    /telegrambot/i,
    /whatsapp/i,
    /curl/i,
    /wget/i,
    /python/i,
    /ruby/i,
    /node/i,
    /php/i,
    /java/i,
    /perl/i,
    /lwp/i,
    /urllib/i,
    /requests/i,
    /http/i,
    /scrapy/i,
    /selenium/i,
    /puppeteer/i,
    /phantomjs/i,
    /casperjs/i,
    /headless/i,
    /zombie/i,
    /mozilla/i,
    /webscraper/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
};

/**
 * Validate date range
 */
const validateDateRange = (startDate, endDate) => {
  // Set default values if not provided
  const now = new Date();
  const defaultStart = new Date(now);
  defaultStart.setDate(defaultStart.getDate() - 30);

  let parsedStartDate = startDate || defaultStart;
  let parsedEndDate = endDate || now;

  // Validate dates
  if (parsedStartDate > parsedEndDate) {
    return {
      valid: false,
      error: "Start date must be before end date",
    };
  }

  // Limit date range to 1 year
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  if (parsedStartDate < oneYearAgo) {
    parsedStartDate = oneYearAgo;
  }

  return {
    valid: true,
    startDate: parsedStartDate,
    endDate: parsedEndDate,
  };
};

module.exports = {
  parseUserAgent,
  getGeoLocation,
  calculateBounceRate,
  calculateAvgSessionDuration,
  aggregateByTimeInterval,
  formatForExport,
  detectBotTraffic,
  validateDateRange,
};
