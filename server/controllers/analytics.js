import { supabase } from "../config/supabase.js";
import { createRequestContextLogger } from "../utils/logger.js";
import { NotFoundError, ForbiddenError } from "../errors/customErrors.js";

export class AnalyticsController {
  /**
   * Get click statistics with filters
   */
  static async getClickStatistics(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const { period = "all", startDate, endDate } = req.query;
      const userId = req.user?.id;

      // Get URL
      const { data: url, error: urlError } = await supabase
        .from("urls")
        .select("id, user_id")
        .eq("short_code", shortCode)
        .single();

      if (urlError || !url) throw new NotFoundError("URL not found");
      if (url.user_id !== userId && req.user?.role !== "admin") {
        throw new ForbiddenError("Access denied");
      }

      // Build date filter
      let dateFilter = {};
      if (period === "today") {
        dateFilter = { gte: new Date().toISOString().split("T")[0] };
      } else if (period === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { gte: weekAgo.toISOString() };
      } else if (period === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = { gte: monthAgo.toISOString() };
      } else if (startDate && endDate) {
        dateFilter = { gte: startDate, lte: endDate };
      }

      let query = supabase.from("clicks").select("*").eq("url_id", url.id);
      if (dateFilter.gte) query = query.gte("created_at", dateFilter.gte);
      if (dateFilter.lte) query = query.lte("created_at", dateFilter.lte);

      const { data: clicks, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      const statistics = {
        total: clicks.length,
        unique_ips: new Set(clicks.map((c) => c.ip_address)).size,
        devices: this.calculatePercentage(clicks, "device_type"),
        browsers: this.calculatePercentage(clicks, "browser"),
        operating_systems: this.calculatePercentage(clicks, "os"),
        countries: this.calculatePercentage(clicks, "country"),
        referrers: this.calculatePercentage(clicks, "referrer"),
        timeline: this.generateTimeline(clicks, period),
        hourly_distribution: this.getHourlyDistribution(clicks),
        daily_average: clicks.length / (this.getDaysInPeriod(period) || 1),
      };

      log.performance("get_click_statistics", Date.now() - startTime);

      res.json({ success: true, data: statistics });
    } catch (error) {
      log.error(error, { action: "get_click_statistics" });
      next(error);
    }
  }

  /**
   * Get top performing links for user
   */
  static async getTopPerformingLinks(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      const { limit = 10, period = "all" } = req.query;

      let query = supabase
        .from("urls")
        .select(
          `
          id,
          short_code,
          original_url,
          title,
          click_count,
          created_at,
          last_clicked_at
        `
        )
        .eq("user_id", userId)
        .order("click_count", { ascending: false })
        .limit(parseInt(limit));

      const { data: urls, error } = await query;

      if (error) throw error;

      const topLinks = urls.map((url) => ({
        ...url,
        shortUrl: `${process.env.BASE_URL}/${url.short_code}`,
        performance_score: this.calculatePerformanceScore(url),
      }));

      log.performance("get_top_performing_links", Date.now() - startTime);

      res.json({ success: true, data: topLinks });
    } catch (error) {
      log.error(error, { action: "get_top_performing_links" });
      next(error);
    }
  }

  /**
   * Get geographic distribution
   */
  static async getGeographicDistribution(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const userId = req.user?.id;

      const { data: url, error: urlError } = await supabase
        .from("urls")
        .select("id, user_id")
        .eq("short_code", shortCode)
        .single();

      if (urlError || !url) throw new NotFoundError("URL not found");
      if (url.user_id !== userId && req.user?.role !== "admin") {
        throw new ForbiddenError("Access denied");
      }

      const { data: clicks, error } = await supabase
        .from("clicks")
        .select("country, city, region, ip_address")
        .eq("url_id", url.id);

      if (error) throw error;

      const geoData = {
        by_country: this.aggregateGeoData(clicks, "country"),
        by_city: this.aggregateGeoData(clicks, "city"),
        by_region: this.aggregateGeoData(clicks, "region"),
        unique_countries: new Set(clicks.map((c) => c.country)).size,
        top_countries: this.getTopLocations(clicks, "country", 5),
      };

      log.performance("get_geographic_distribution", Date.now() - startTime);

      res.json({ success: true, data: geoData });
    } catch (error) {
      log.error(error, { action: "get_geographic_distribution" });
      next(error);
    }
  }

  /**
   * Get device/browser breakdown
   */
  static async getDeviceBreakdown(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const userId = req.user?.id;

      const { data: url, error: urlError } = await supabase
        .from("urls")
        .select("id, user_id")
        .eq("short_code", shortCode)
        .single();

      if (urlError || !url) throw new NotFoundError("URL not found");
      if (url.user_id !== userId && req.user?.role !== "admin") {
        throw new ForbiddenError("Access denied");
      }

      const { data: clicks, error } = await supabase
        .from("clicks")
        .select("device_type, browser, os, screen_resolution")
        .eq("url_id", url.id);

      if (error) throw error;

      const breakdown = {
        devices: this.calculatePercentage(clicks, "device_type"),
        browsers: this.calculatePercentage(clicks, "browser"),
        operating_systems: this.calculatePercentage(clicks, "os"),
        device_browser_matrix: this.getDeviceBrowserMatrix(clicks),
      };

      log.performance("get_device_breakdown", Date.now() - startTime);

      res.json({ success: true, data: breakdown });
    } catch (error) {
      log.error(error, { action: "get_device_breakdown" });
      next(error);
    }
  }

  // Helper methods
  static calculatePercentage(data, field) {
    if (!data || data.length === 0) return {};
    const counts = {};
    data.forEach((item) => {
      const key = item[field] || "Unknown";
      counts[key] = (counts[key] || 0) + 1;
    });

    const percentages = {};
    Object.entries(counts).forEach(([key, count]) => {
      percentages[key] = parseFloat(((count / data.length) * 100).toFixed(1));
    });
    return percentages;
  }

  static generateTimeline(clicks, period) {
    const timeline = {};
    clicks.forEach((click) => {
      let key;
      const date = new Date(click.created_at);

      if (period === "today") {
        key = `${date.getHours()}:00`;
      } else if (period === "week") {
        key = date.toLocaleDateString("en-US", { weekday: "short" });
      } else {
        key = date.toISOString().split("T")[0];
      }

      timeline[key] = (timeline[key] || 0) + 1;
    });
    return timeline;
  }

  static getHourlyDistribution(clicks) {
    const hours = Array(24).fill(0);
    clicks.forEach((click) => {
      const hour = new Date(click.created_at).getHours();
      hours[hour]++;
    });
    return hours;
  }

  static getDaysInPeriod(period) {
    if (period === "today") return 1;
    if (period === "week") return 7;
    if (period === "month") return 30;
    return 30; // default for 'all'
  }

  static calculatePerformanceScore(url) {
    const ageInDays =
      (new Date() - new Date(url.created_at)) / (1000 * 60 * 60 * 24);
    const clicksPerDay = url.click_count / (ageInDays || 1);
    const recencyBonus = url.last_clicked_at
      ? (7 -
          (new Date() - new Date(url.last_clicked_at)) /
            (1000 * 60 * 60 * 24)) /
        7
      : 0;

    return Math.min(100, Math.round(clicksPerDay * 10 + recencyBonus * 20));
  }

  static aggregateGeoData(clicks, field) {
    const data = {};
    clicks.forEach((click) => {
      const key = click[field] || "Unknown";
      data[key] = (data[key] || 0) + 1;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  static getTopLocations(clicks, field, limit) {
    const aggregated = this.aggregateGeoData(clicks, field);
    return aggregated.slice(0, limit);
  }

  static getDeviceBrowserMatrix(clicks) {
    const matrix = {};
    clicks.forEach((click) => {
      const device = click.device_type || "Unknown";
      const browser = click.browser || "Unknown";
      if (!matrix[device]) matrix[device] = {};
      matrix[device][browser] = (matrix[device][browser] || 0) + 1;
    });
    return matrix;
  }

  /**
   * Export analytics data (JSON / CSV)
   */
  static async exportAnalytics(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const { format = "json", period = "all" } = req.query;
      const userId = req.user?.id;

      // Verify URL ownership
      const { data: url, error: urlError } = await supabase
        .from("urls")
        .select("id, user_id, short_code, original_url")
        .eq("short_code", shortCode)
        .single();

      if (urlError || !url) throw new NotFoundError("URL not found");

      if (url.user_id !== userId && req.user?.role !== "admin") {
        throw new ForbiddenError("Access denied");
      }

      // Fetch all clicks
      let query = supabase
        .from("clicks")
        .select("*")
        .eq("url_id", url.id)
        .order("created_at", { ascending: false });

      // Apply period filter if needed
      if (period !== "all") {
        const days = period === "today" ? 1 : period === "week" ? 7 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte("created_at", startDate.toISOString());
      }

      const { data: clicks, error } = await query;

      if (error) throw error;

      const exportData = {
        shortCode: url.short_code,
        originalUrl: url.original_url,
        exportedAt: new Date().toISOString(),
        totalClicks: clicks.length,
        period,
        statistics: {
          unique_ips: new Set(clicks.map((c) => c.ip_address)).size,
          devices: this.calculatePercentage(clicks, "device_type"),
          browsers: this.calculatePercentage(clicks, "browser"),
          countries: this.calculatePercentage(clicks, "country"),
        },
        clicks: clicks.map((click) => ({
          timestamp: click.created_at,
          ip_address: click.ip_address,
          country: click.country,
          city: click.city,
          device: click.device_type,
          browser: click.browser,
          os: click.os,
          referrer: click.referrer,
        })),
      };

      log.business("analytics_exported", {
        shortCode,
        userId,
        format,
        clickCount: clicks.length,
      });

      log.performance("export_analytics", Date.now() - startTime);

      if (format === "csv") {
        const csv = this.convertToCSV(exportData.clicks);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="analytics_${shortCode}_${period}.csv"`
        );
        return res.send(csv);
      }

      // Default JSON
      res.json({
        success: true,
        data: exportData,
      });
    } catch (error) {
      log.error(error, { action: "export_analytics" });
      next(error);
    }
  }

  /**
   * Get real-time analytics (last 24 hours / last hour)
   */
  static async getRealtimeAnalytics(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;
      const userId = req.user?.id;

      const { data: url } = await supabase
        .from("urls")
        .select("id, user_id")
        .eq("short_code", shortCode)
        .single();

      if (!url) throw new NotFoundError("URL not found");
      if (url.user_id !== userId && req.user?.role !== "admin") {
        throw new ForbiddenError("Access denied");
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const [lastHourClicks, lastDayClicks] = await Promise.all([
        supabase
          .from("clicks")
          .select("created_at, device_type, country")
          .eq("url_id", url.id)
          .gte("created_at", oneHourAgo.toISOString()),

        supabase
          .from("clicks")
          .select("created_at, country, device_type")
          .eq("url_id", url.id)
          .gte("created_at", twentyFourHoursAgo.toISOString()),
      ]);

      const realtime = {
        clicks_last_hour: lastHourClicks.data?.length || 0,
        clicks_last_24h: lastDayClicks.data?.length || 0,
        top_countries_last_day: this.getTopLocations(
          lastDayClicks.data || [],
          "country",
          5
        ),
        top_devices_last_day: this.calculatePercentage(
          lastDayClicks.data || [],
          "device_type"
        ),
        is_active: true, // You can enhance this with real status
      };

      log.performance("realtime_analytics", Date.now() - startTime);

      res.json({
        success: true,
        data: realtime,
      });
    } catch (error) {
      log.error(error, { action: "realtime_analytics" });
      next(error);
    }
  }

  /**
   * Compare analytics between two URLs
   */
  static async compareUrls(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode1, shortCode2, period = "30d" } = req.body;
      const userId = req.user?.id;

      if (!shortCode1 || !shortCode2) {
        throw new BadRequestError(
          "Both shortCode1 and shortCode2 are required"
        );
      }

      // Fetch both URLs
      const [url1Res, url2Res] = await Promise.all([
        supabase
          .from("urls")
          .select("id, user_id, short_code, original_url")
          .eq("short_code", shortCode1)
          .single(),
        supabase
          .from("urls")
          .select("id, user_id, short_code, original_url")
          .eq("short_code", shortCode2)
          .single(),
      ]);

      if (!url1Res.data || !url2Res.data) {
        throw new NotFoundError("One or both URLs not found");
      }

      const url1 = url1Res.data;
      const url2 = url2Res.data;

      // Permission check
      const hasAccess1 = url1.user_id === userId || req.user?.role === "admin";
      const hasAccess2 = url2.user_id === userId || req.user?.role === "admin";

      if (!hasAccess1 || !hasAccess2) {
        throw new ForbiddenError("Access denied to one or both URLs");
      }

      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [clicks1, clicks2] = await Promise.all([
        supabase
          .from("clicks")
          .select("created_at, device_type, country")
          .eq("url_id", url1.id)
          .gte("created_at", startDate.toISOString()),

        supabase
          .from("clicks")
          .select("created_at, device_type, country")
          .eq("url_id", url2.id)
          .gte("created_at", startDate.toISOString()),
      ]);

      const comparison = {
        period,
        url1: {
          shortCode: url1.short_code,
          originalUrl: url1.original_url,
          totalClicks: clicks1.data?.length || 0,
          uniqueCountries: new Set(clicks1.data?.map((c) => c.country)).size,
        },
        url2: {
          shortCode: url2.short_code,
          originalUrl: url2.original_url,
          totalClicks: clicks2.data?.length || 0,
          uniqueCountries: new Set(clicks2.data?.map((c) => c.country)).size,
        },
        difference: {
          clicks: (clicks1.data?.length || 0) - (clicks2.data?.length || 0),
        },
        devicesComparison: {
          url1: this.calculatePercentage(clicks1.data || [], "device_type"),
          url2: this.calculatePercentage(clicks2.data || [], "device_type"),
        },
      };

      log.business("urls_compared", { shortCode1, shortCode2, userId });

      log.performance("compare_urls", Date.now() - startTime);

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      log.error(error, { action: "compare_urls" });
      next(error);
    }
  }

  /**
   * Helper: Convert data to CSV
   */
  static convertToCSV(data) {
    if (!data || data.length === 0) return "No data available";

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    for (const row of data) {
      const values = headers.map((header) => {
        let value = row[header];
        if (value == null) value = "";
        if (typeof value === "object") value = JSON.stringify(value);
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  }
}
