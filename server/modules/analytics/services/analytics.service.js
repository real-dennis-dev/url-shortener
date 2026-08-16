// src/modules/analytics/services/analytics.service.js
const DatabaseService = require("../../../services/database.service");
const CacheService = require("../../../services/cache.service");
const { AppError } = require("../../../utils/error.utils");
const {
  parseUserAgent,
  getGeoLocation,
  calculateBounceRate,
  calculateAvgSessionDuration,
  aggregateByTimeInterval,
  formatForExport,
  detectBotTraffic,
} = require("../utils/analytics.utils");

class AnalyticsService {
  /**
   * Get dashboard data
   */
  async getDashboardAnalytics(userId, dateRange) {
    try {
      const cacheKey = `analytics_dashboard:${userId}:${dateRange.startDate.getTime()}:${dateRange.endDate.getTime()}`;
      const cachedData = await CacheService.get(cacheKey);

      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // Get overview stats
      const overview = await this.getOverviewAnalytics(userId, dateRange);

      // Get recent URLs with click data
      const recentUrlsQuery = `
        SELECT 
          u.id,
          u.short_code,
          u.original_url,
          u.title,
          u.click_count,
          u.created_at,
          COUNT(c.id) as clicks_7d
        FROM public.urls u
        LEFT JOIN public.clicks c ON u.id = c.url_id 
          AND c.created_at >= NOW() - INTERVAL '7 days'
        WHERE u.user_id = $1
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT 10
      `;

      const recentUrls = await DatabaseService.executeWithRetry({
        text: recentUrlsQuery,
        values: [userId],
      });

      // Get chart data for dashboard
      const chartData = await this.getTimelineData(
        null,
        userId,
        dateRange,
        "day"
      );

      const dashboardData = {
        overview,
        recentUrls: recentUrls.rows,
        chartData,
        timestamp: new Date().toISOString(),
      };

      // Cache for 5 minutes
      await CacheService.set(cacheKey, JSON.stringify(dashboardData), 300);

      return dashboardData;
    } catch (error) {
      throw new AppError(
        `Failed to get dashboard analytics: ${error.message}`,
        500
      );
    }
  }

  /**
   * Get URL analytics
   */
  async getUrlAnalytics(urlId, userId, filters) {
    try {
      // First, verify URL ownership
      const urlQuery = `
        SELECT id, short_code, original_url, title, click_count
        FROM public.urls
        WHERE id = $1 AND user_id = $2
      `;

      const urlResult = await DatabaseService.executeWithRetry({
        text: urlQuery,
        values: [urlId, userId],
      });

      if (urlResult.rows.length === 0) {
        throw new AppError("URL not found or you do not have access", 404);
      }

      const url = urlResult.rows[0];

      // Get clicks data with filters
      let query = `
        SELECT 
          c.id,
          c.ip_address,
          c.device_type,
          c.browser,
          c.browser_version,
          c.os,
          c.os_version,
          c.country,
          c.city,
          c.region,
          c.referrer,
          c.referrer_domain,
          c.is_unique,
          c.created_at
        FROM public.clicks c
        WHERE c.url_id = $1
      `;

      const values = [urlId];
      let paramIndex = 2;

      // Apply date filters
      if (filters.dateRange) {
        query += ` AND c.created_at >= $${paramIndex}`;
        values.push(filters.dateRange.startDate);
        paramIndex++;

        query += ` AND c.created_at <= $${paramIndex}`;
        values.push(filters.dateRange.endDate);
        paramIndex++;
      }

      // Apply device filter
      if (filters.deviceType) {
        query += ` AND c.device_type = $${paramIndex}`;
        values.push(filters.deviceType);
        paramIndex++;
      }

      // Apply country filter
      if (filters.country) {
        query += ` AND c.country = $${paramIndex}`;
        values.push(filters.country);
        paramIndex++;
      }

      // Apply browser filter
      if (filters.browser) {
        query += ` AND c.browser = $${paramIndex}`;
        values.push(filters.browser);
        paramIndex++;
      }

      query += ` ORDER BY c.created_at DESC LIMIT 1000`;

      const clicksResult = await DatabaseService.executeWithRetry({
        text: query,
        values,
      });

      const clicks = clicksResult.rows;

      // Process analytics data
      const devices = {};
      const browsers = {};
      const countries = {};
      const referrers = {};
      const timeline = {};
      let totalUniqueVisitors = 0;

      // Process each click
      clicks.forEach((click) => {
        // Count devices
        if (click.device_type) {
          devices[click.device_type] = (devices[click.device_type] || 0) + 1;
        }

        // Count browsers
        if (click.browser) {
          browsers[click.browser] = (browsers[click.browser] || 0) + 1;
        }

        // Count countries
        if (click.country) {
          countries[click.country] = (countries[click.country] || 0) + 1;
        }

        // Count referrers
        if (click.referrer_domain) {
          referrers[click.referrer_domain] =
            (referrers[click.referrer_domain] || 0) + 1;
        }

        // Track unique visitors
        if (click.is_unique) {
          totalUniqueVisitors++;
        }

        // Timeline data
        const dateKey = click.created_at.toISOString().split("T")[0];
        timeline[dateKey] = (timeline[dateKey] || 0) + 1;
      });

      return {
        url,
        summary: {
          totalClicks: clicks.length,
          uniqueVisitors: totalUniqueVisitors,
          devices: Object.keys(devices).length,
          browsers: Object.keys(browsers).length,
          countries: Object.keys(countries).length,
          referrers: Object.keys(referrers).length,
        },
        devices: this._sortAndLimit(devices, 10),
        browsers: this._sortAndLimit(browsers, 10),
        countries: this._sortAndLimit(countries, 10),
        referrers: this._sortAndLimit(referrers, 10),
        timeline: Object.entries(timeline)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, count]) => ({ date, count })),
        recentClicks: clicks.slice(0, 50),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to get URL analytics: ${error.message}`, 500);
    }
  }

  /**
   * Get overview analytics
   */
  async getOverviewAnalytics(userId, dateRange) {
    try {
      // Get total URLs and clicks for user
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT u.id) as total_urls,
          SUM(u.click_count) as total_clicks,
          COUNT(DISTINCT CASE WHEN u.created_at >= $1 THEN u.id END) as new_urls,
          SUM(CASE WHEN c.created_at >= $1 THEN 1 ELSE 0 END) as new_clicks
        FROM public.urls u
        LEFT JOIN public.clicks c ON u.id = c.url_id
        WHERE u.user_id = $2
      `;

      const statsResult = await DatabaseService.executeWithRetry({
        text: statsQuery,
        values: [dateRange.startDate, userId],
      });

      const stats = statsResult.rows[0] || {
        total_urls: 0,
        total_clicks: 0,
        new_urls: 0,
        new_clicks: 0,
      };

      // Get active URLs (clicked in last 30 days)
      const activeUrlsQuery = `
        SELECT COUNT(DISTINCT u.id) as active_urls
        FROM public.urls u
        INNER JOIN public.clicks c ON u.id = c.url_id
        WHERE u.user_id = $1
          AND c.created_at >= NOW() - INTERVAL '30 days'
      `;

      const activeUrlsResult = await DatabaseService.executeWithRetry({
        text: activeUrlsQuery,
        values: [userId],
      });

      const activeUrls = activeUrlsResult.rows[0]?.active_urls || 0;

      // Get top performing URLs
      const topUrlsQuery = `
        SELECT 
          u.id,
          u.short_code,
          u.original_url,
          u.title,
          u.click_count
        FROM public.urls u
        WHERE u.user_id = $1
        ORDER BY u.click_count DESC
        LIMIT 5
      `;

      const topUrlsResult = await DatabaseService.executeWithRetry({
        text: topUrlsQuery,
        values: [userId],
      });

      return {
        totalUrls: parseInt(stats.total_urls || 0),
        totalClicks: parseInt(stats.total_clicks || 0),
        newUrls: parseInt(stats.new_urls || 0),
        newClicks: parseInt(stats.new_clicks || 0),
        activeUrls: parseInt(activeUrls),
        clickThroughRate:
          stats.total_urls > 0
            ? (stats.total_clicks / stats.total_urls).toFixed(2)
            : 0,
        topUrls: topUrlsResult.rows,
        period: {
          start: dateRange.startDate,
          end: dateRange.endDate,
        },
      };
    } catch (error) {
      throw new AppError(
        `Failed to get overview analytics: ${error.message}`,
        500
      );
    }
  }

  /**
   * Get top referrers
   */
  async getTopReferrers(urlId, userId, limit) {
    try {
      let query = `
        SELECT 
          c.referrer_domain,
          COUNT(*) as count,
          COUNT(DISTINCT c.session_id) as unique_sessions
        FROM public.clicks c
        INNER JOIN public.urls u ON c.url_id = u.id
        WHERE u.user_id = $1
      `;

      const values = [userId];
      let paramIndex = 2;

      if (urlId) {
        query += ` AND c.url_id = $${paramIndex}`;
        values.push(urlId);
        paramIndex++;
      }

      query += `
        AND c.referrer_domain IS NOT NULL
        GROUP BY c.referrer_domain
        ORDER BY count DESC
        LIMIT $${paramIndex}
      `;
      values.push(limit);

      const result = await DatabaseService.executeWithRetry({
        text: query,
        values,
      });

      return result.rows;
    } catch (error) {
      throw new AppError(`Failed to get top referrers: ${error.message}`, 500);
    }
  }

  /**
   * Get device analytics
   */
  async getDeviceAnalytics(urlId, userId, dateRange) {
    try {
      let query = `
        SELECT 
          c.device_type,
          c.browser,
          c.os,
          COUNT(*) as count
        FROM public.clicks c
        INNER JOIN public.urls u ON c.url_id = u.id
        WHERE u.user_id = $1
      `;

      const values = [userId];
      let paramIndex = 2;

      if (urlId) {
        query += ` AND c.url_id = $${paramIndex}`;
        values.push(urlId);
        paramIndex++;
      }

      if (dateRange) {
        query += ` AND c.created_at >= $${paramIndex}`;
        values.push(dateRange.startDate);
        paramIndex++;

        query += ` AND c.created_at <= $${paramIndex}`;
        values.push(dateRange.endDate);
        paramIndex++;
      }

      query += `
        GROUP BY c.device_type, c.browser, c.os
        ORDER BY count DESC
      `;

      const result = await DatabaseService.executeWithRetry({
        text: query,
        values,
      });

      // Process data for charts
      const deviceData = {};
      const browserData = {};
      const osData = {};

      result.rows.forEach((row) => {
        if (row.device_type) {
          deviceData[row.device_type] =
            (deviceData[row.device_type] || 0) + parseInt(row.count);
        }
        if (row.browser) {
          browserData[row.browser] =
            (browserData[row.browser] || 0) + parseInt(row.count);
        }
        if (row.os) {
          osData[row.os] = (osData[row.os] || 0) + parseInt(row.count);
        }
      });

      return {
        devices: Object.entries(deviceData)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
        browsers: Object.entries(browserData)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
        operatingSystems: Object.entries(osData)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value),
      };
    } catch (error) {
      throw new AppError(
        `Failed to get device analytics: ${error.message}`,
        500
      );
    }
  }

  /**
   * Get location analytics
   */
  async getLocationAnalytics(urlId, userId, dateRange) {
    try {
      let query = `
        SELECT 
          c.country,
          c.city,
          c.region,
          COUNT(*) as count,
          COUNT(DISTINCT c.ip_address) as unique_visitors
        FROM public.clicks c
        INNER JOIN public.urls u ON c.url_id = u.id
        WHERE u.user_id = $1
      `;

      const values = [userId];
      let paramIndex = 2;

      if (urlId) {
        query += ` AND c.url_id = $${paramIndex}`;
        values.push(urlId);
        paramIndex++;
      }

      if (dateRange) {
        query += ` AND c.created_at >= $${paramIndex}`;
        values.push(dateRange.startDate);
        paramIndex++;

        query += ` AND c.created_at <= $${paramIndex}`;
        values.push(dateRange.endDate);
        paramIndex++;
      }

      query += `
        GROUP BY c.country, c.city, c.region
        ORDER BY count DESC
      `;

      const result = await DatabaseService.executeWithRetry({
        text: query,
        values,
      });

      // Process data for maps and charts
      const countryData = {};
      const cityData = {};
      const regionData = {};

      result.rows.forEach((row) => {
        if (row.country) {
          countryData[row.country] = {
            visits:
              (countryData[row.country]?.visits || 0) + parseInt(row.count),
            uniqueVisitors:
              (countryData[row.country]?.uniqueVisitors || 0) +
              parseInt(row.unique_visitors),
          };
        }
        if (row.city) {
          cityData[row.city] = (cityData[row.city] || 0) + parseInt(row.count);
        }
        if (row.region) {
          regionData[row.region] =
            (regionData[row.region] || 0) + parseInt(row.count);
        }
      });

      return {
        countries: Object.entries(countryData)
          .map(([name, data]) => ({
            name,
            visits: data.visits,
            uniqueVisitors: data.uniqueVisitors,
          }))
          .sort((a, b) => b.visits - a.visits),
        cities: Object.entries(cityData)
          .map(([name, visits]) => ({ name, visits }))
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 20),
        regions: Object.entries(regionData)
          .map(([name, visits]) => ({ name, visits }))
          .sort((a, b) => b.visits - a.visits)
          .slice(0, 10),
      };
    } catch (error) {
      throw new AppError(
        `Failed to get location analytics: ${error.message}`,
        500
      );
    }
  }

  /**
   * Get timeline data
   */
  async getTimelineData(urlId, userId, dateRange, interval) {
    try {
      let query = `
        SELECT 
          DATE_TRUNC($1, c.created_at) as time_period,
          COUNT(*) as clicks,
          COUNT(DISTINCT c.session_id) as unique_visitors,
          COUNT(DISTINCT c.ip_address) as unique_ips
        FROM public.clicks c
        INNER JOIN public.urls u ON c.url_id = u.id
        WHERE u.user_id = $2
      `;

      const values = [interval, userId];
      let paramIndex = 3;

      if (urlId) {
        query += ` AND c.url_id = $${paramIndex}`;
        values.push(urlId);
        paramIndex++;
      }

      if (dateRange) {
        query += ` AND c.created_at >= $${paramIndex}`;
        values.push(dateRange.startDate);
        paramIndex++;

        query += ` AND c.created_at <= $${paramIndex}`;
        values.push(dateRange.endDate);
        paramIndex++;
      }

      query += `
        GROUP BY time_period
        ORDER BY time_period ASC
      `;

      const result = await DatabaseService.executeWithRetry({
        text: query,
        values,
      });

      return {
        labels: result.rows.map((row) => row.time_period),
        clicks: result.rows.map((row) => parseInt(row.clicks)),
        uniqueVisitors: result.rows.map((row) => parseInt(row.unique_visitors)),
        uniqueIps: result.rows.map((row) => parseInt(row.unique_ips)),
      };
    } catch (error) {
      throw new AppError(`Failed to get timeline data: ${error.message}`, 500);
    }
  }

  /**
   * Export analytics
   */
  async exportAnalytics(urlId, userId, format, dateRange) {
    try {
      // Get full analytics data
      const analyticsData = await this.getUrlAnalytics(urlId, userId, {
        dateRange,
      });

      // Format data for export
      const exportData = {
        url: analyticsData.url,
        summary: analyticsData.summary,
        timeline: analyticsData.timeline,
        devices: analyticsData.devices,
        browsers: analyticsData.browsers,
        countries: analyticsData.countries,
        referrers: analyticsData.referrers,
        recentClicks: analyticsData.recentClicks,
        exportedAt: new Date().toISOString(),
      };

      // Format based on requested format
      const formatted = formatForExport(exportData, format);

      let contentType = "";
      let filename = `analytics_${analyticsData.url.short_code}`;

      switch (format) {
        case "csv":
          contentType = "text/csv";
          filename += ".csv";
          break;
        case "json":
          contentType = "application/json";
          filename += ".json";
          break;
        case "excel":
          contentType =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          filename += ".xlsx";
          break;
        default:
          contentType = "text/csv";
          filename += ".csv";
      }

      return {
        data: formatted,
        contentType,
        filename,
      };
    } catch (error) {
      throw new AppError(`Failed to export analytics: ${error.message}`, 500);
    }
  }

  /**
   * Get real-time analytics
   */
  async getRealtimeAnalytics(userId) {
    try {
      // Get clicks in last hour
      const recentClicksQuery = `
        SELECT 
          c.*,
          u.short_code,
          u.title
        FROM public.clicks c
        INNER JOIN public.urls u ON c.url_id = u.id
        WHERE u.user_id = $1
          AND c.created_at >= NOW() - INTERVAL '1 hour'
        ORDER BY c.created_at DESC
        LIMIT 100
      `;

      const recentClicksResult = await DatabaseService.executeWithRetry({
        text: recentClicksQuery,
        values: [userId],
      });

      // Get active users count (unique IPs in last 15 minutes)
      const activeUsersQuery = `
        SELECT COUNT(DISTINCT c.ip_address) as active_users
        FROM public.clicks c
        INNER JOIN public.urls u ON c.url_id = u.id
        WHERE u.user_id = $1
          AND c.created_at >= NOW() - INTERVAL '15 minutes'
      `;

      const activeUsersResult = await DatabaseService.executeWithRetry({
        text: activeUsersQuery,
        values: [userId],
      });

      // Get clicks per minute in last 30 minutes
      const clicksPerMinuteQuery = `
        SELECT 
          DATE_TRUNC('minute', c.created_at) as minute,
          COUNT(*) as clicks
        FROM public.clicks c
        INNER JOIN public.urls u ON c.url_id = u.id
        WHERE u.user_id = $1
          AND c.created_at >= NOW() - INTERVAL '30 minutes'
        GROUP BY minute
        ORDER BY minute ASC
      `;

      const clicksPerMinuteResult = await DatabaseService.executeWithRetry({
        text: clicksPerMinuteQuery,
        values: [userId],
      });

      return {
        activeUsers: parseInt(activeUsersResult.rows[0]?.active_users || 0),
        clicksLastHour: recentClicksResult.rows.length,
        recentClicks: recentClicksResult.rows.slice(0, 20),
        clicksPerMinute: clicksPerMinuteResult.rows.map((row) => ({
          minute: row.minute,
          clicks: parseInt(row.clicks),
        })),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new AppError(
        `Failed to get real-time analytics: ${error.message}`,
        500
      );
    }
  }

  /**
   * Update analytics summary
   */
  async updateAnalyticsSummary(urlId) {
    try {
      // Get yesterday's data
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const query = `
        INSERT INTO public.analytics_summary (
          url_id,
          date,
          total_clicks,
          unique_visitors,
          devices,
          browsers,
          countries,
          referrers
        )
        SELECT 
          $1 as url_id,
          DATE($2) as date,
          COUNT(*) as total_clicks,
          COUNT(DISTINCT c.ip_address) as unique_visitors,
          jsonb_build_object(
            'mobile', COUNT(CASE WHEN c.device_type = 'mobile' THEN 1 END),
            'desktop', COUNT(CASE WHEN c.device_type = 'desktop' THEN 1 END),
            'tablet', COUNT(CASE WHEN c.device_type = 'tablet' THEN 1 END)
          ) as devices,
          jsonb_build_object(
            'chrome', COUNT(CASE WHEN c.browser ILIKE '%chrome%' THEN 1 END),
            'firefox', COUNT(CASE WHEN c.browser ILIKE '%firefox%' THEN 1 END),
            'safari', COUNT(CASE WHEN c.browser ILIKE '%safari%' THEN 1 END),
            'edge', COUNT(CASE WHEN c.browser ILIKE '%edge%' THEN 1 END),
            'other', COUNT(CASE WHEN c.browser NOT ILIKE '%chrome%' 
              AND c.browser NOT ILIKE '%firefox%' 
              AND c.browser NOT ILIKE '%safari%' 
              AND c.browser NOT ILIKE '%edge%' THEN 1 END)
          ) as browsers,
          jsonb_object_agg(c.country, COUNT(*)) as countries,
          jsonb_object_agg(c.referrer_domain, COUNT(*)) as referrers
        FROM public.clicks c
        WHERE c.url_id = $1
          AND c.created_at >= $2
          AND c.created_at < $3
        GROUP BY url_id, DATE(c.created_at)
        ON CONFLICT (url_id, date) 
        DO UPDATE SET
          total_clicks = EXCLUDED.total_clicks,
          unique_visitors = EXCLUDED.unique_visitors,
          devices = EXCLUDED.devices,
          browsers = EXCLUDED.browsers,
          countries = EXCLUDED.countries,
          referrers = EXCLUDED.referrers,
          updated_at = NOW()
      `;

      await DatabaseService.executeWithRetry({
        text: query,
        values: [urlId, yesterday, today],
      });

      return { success: true };
    } catch (error) {
      throw new AppError(
        `Failed to update analytics summary: ${error.message}`,
        500
      );
    }
  }

  /**
   * Helper: Sort and limit data
   */
  _sortAndLimit(data, limit) {
    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, value]) => ({ name, value }));
  }
}

module.exports = new AnalyticsService();
