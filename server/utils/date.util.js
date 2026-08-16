// src/utils/date.util.js
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const isBetween = require("dayjs/plugin/isBetween");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
const relativeTime = require("dayjs/plugin/relativeTime");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(relativeTime);

class DateUtil {
  /**
   * Get current timestamp
   * @param {string} timezone - Timezone
   * @returns {Date} - Current date
   */
  static now(timezone = "UTC") {
    return dayjs().tz(timezone).toDate();
  }

  /**
   * Format date
   * @param {Date|string} date - Date to format
   * @param {string} format - Format string
   * @param {string} timezone - Timezone
   * @returns {string} - Formatted date
   */
  static format(date, format = "YYYY-MM-DD HH:mm:ss", timezone = "UTC") {
    return dayjs(date).tz(timezone).format(format);
  }

  /**
   * Parse date
   * @param {string} dateString - Date string
   * @param {string} format - Format string
   * @param {string} timezone - Timezone
   * @returns {Date} - Parsed date
   */
  static parse(dateString, format = "YYYY-MM-DD HH:mm:ss", timezone = "UTC") {
    return dayjs.tz(dateString, format, timezone).toDate();
  }

  /**
   * Add time to date
   * @param {Date|string} date - Date
   * @param {number} amount - Amount to add
   * @param {string} unit - Unit (days, hours, minutes, etc.)
   * @returns {Date} - New date
   */
  static add(date, amount, unit = "days") {
    return dayjs(date).add(amount, unit).toDate();
  }

  /**
   * Subtract time from date
   * @param {Date|string} date - Date
   * @param {number} amount - Amount to subtract
   * @param {string} unit - Unit (days, hours, minutes, etc.)
   * @returns {Date} - New date
   */
  static subtract(date, amount, unit = "days") {
    return dayjs(date).subtract(amount, unit).toDate();
  }

  /**
   * Get difference between dates
   * @param {Date|string} date1 - First date
   * @param {Date|string} date2 - Second date
   * @param {string} unit - Unit (days, hours, minutes, etc.)
   * @returns {number} - Difference
   */
  static diff(date1, date2, unit = "days") {
    return dayjs(date1).diff(dayjs(date2), unit);
  }

  /**
   * Check if date is in past
   * @param {Date|string} date - Date to check
   * @returns {boolean} - Is in past
   */
  static isPast(date) {
    return dayjs(date).isBefore(dayjs());
  }

  /**
   * Check if date is in future
   * @param {Date|string} date - Date to check
   * @returns {boolean} - Is in future
   */
  static isFuture(date) {
    return dayjs(date).isAfter(dayjs());
  }

  /**
   * Get start of day
   * @param {Date|string} date - Date
   * @param {string} timezone - Timezone
   * @returns {Date} - Start of day
   */
  static startOfDay(date, timezone = "UTC") {
    return dayjs(date).tz(timezone).startOf("day").toDate();
  }

  /**
   * Get end of day
   * @param {Date|string} date - Date
   * @param {string} timezone - Timezone
   * @returns {Date} - End of day
   */
  static endOfDay(date, timezone = "UTC") {
    return dayjs(date).tz(timezone).endOf("day").toDate();
  }

  /**
   * Get date range
   * @param {string} range - Range type (today, week, month, year)
   * @param {string} timezone - Timezone
   * @returns {Object} - {start, end}
   */
  static getDateRange(range, timezone = "UTC") {
    const now = dayjs().tz(timezone);
    let start, end;

    switch (range) {
      case "today":
        start = now.startOf("day");
        end = now.endOf("day");
        break;
      case "yesterday":
        start = now.subtract(1, "day").startOf("day");
        end = now.subtract(1, "day").endOf("day");
        break;
      case "week":
        start = now.startOf("week");
        end = now.endOf("week");
        break;
      case "month":
        start = now.startOf("month");
        end = now.endOf("month");
        break;
      case "year":
        start = now.startOf("year");
        end = now.endOf("year");
        break;
      case "last7days":
        start = now.subtract(7, "days").startOf("day");
        end = now.endOf("day");
        break;
      case "last30days":
        start = now.subtract(30, "days").startOf("day");
        end = now.endOf("day");
        break;
      default:
        start = now.startOf("day");
        end = now.endOf("day");
    }

    return {
      start: start.toDate(),
      end: end.toDate(),
    };
  }

  /**
   * Get time ago string
   * @param {Date|string} date - Date
   * @returns {string} - Time ago
   */
  static timeAgo(date) {
    return dayjs(date).fromNow();
  }

  /**
   * Get time until string
   * @param {Date|string} date - Date
   * @returns {string} - Time until
   */
  static timeUntil(date) {
    return dayjs(date).toNow();
  }

  /**
   * Check if date is between two dates
   * @param {Date|string} date - Date to check
   * @param {Date|string} start - Start date
   * @param {Date|string} end - End date
   * @returns {boolean} - Is between
   */
  static isBetween(date, start, end) {
    return dayjs(date).isBetween(dayjs(start), dayjs(end));
  }

  /**
   * Get all dates in range
   * @param {Date|string} start - Start date
   * @param {Date|string} end - End date
   * @param {string} unit - Unit (days, weeks, months)
   * @returns {Array} - Array of dates
   */
  static getDateRangeArray(start, end, unit = "days") {
    const dates = [];
    let current = dayjs(start);
    const endMoment = dayjs(end);

    while (current.isSameOrBefore(endMoment)) {
      dates.push(current.toDate());
      current = current.add(1, unit);
    }

    return dates;
  }

  /**
   * Get business days between dates
   * @param {Date|string} start - Start date
   * @param {Date|string} end - End date
   * @returns {number} - Number of business days
   */
  static getBusinessDays(start, end) {
    let startMoment = dayjs(start);
    const endMoment = dayjs(end);
    let count = 0;

    while (startMoment.isSameOrBefore(endMoment)) {
      const day = startMoment.day(); // 0 = Sunday, 6 = Saturday
      if (day !== 0 && day !== 6) {
        count++;
      }
      startMoment = startMoment.add(1, "day");
    }

    return count;
  }

  /**
   * Validate date string
   * @param {string} dateString - Date string
   * @param {string} format - Date format
   * @returns {boolean} - Is valid date
   */
  static isValidDate(dateString, format = "YYYY-MM-DD") {
    return dayjs(dateString, format, true).isValid();
  }
}

module.exports = DateUtil;
