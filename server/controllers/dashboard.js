import { supabase } from "../config/supabase.js";
import { createRequestContextLogger } from "../utils/logger.js";
import { UnauthorizedError } from "../errors/customErrors.js";

export class DashboardController {
  /**
   * Get overview dashboard data
   */
  static async getOverview(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      // Get all user's URLs
      const { data: urls, error: urlsError } = await supabase
        .from("urls")
        .select(
          "id, short_code, original_url, click_count, created_at, last_clicked_at, is_active"
        )
        .eq("user_id", userId);

      if (urlsError) throw urlsError;

      // Get recent clicks
      const urlIds = urls.map((u) => u.id);
      const { data: recentClicks, error: clicksError } = await supabase
        .from("clicks")
        .select("*, urls!inner(short_code, original_url)")
        .in("url_id", urlIds)
        .order("created_at", { ascending: false })
        .limit(20);

      if (clicksError) throw clicksError;

      // Calculate dashboard metrics
      const metrics = this.calculateMetrics(urls);

      // Get top links
      const topLinks = [...urls]
        .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
        .slice(0, 5)
        .map((url) => ({
          ...url,
          shortUrl: `${process.env.BASE_URL}/${url.short_code}`,
        }));

      // Get recent activity
      const recentActivity = this.getRecentActivity(urls, recentClicks || []);

      // Get performance trends
      const trends = this.getTrendsData(urls);

      // Get system status
      const systemStatus = await this.getSystemStatus(userId);

      log.performance("dashboard_overview", Date.now() - startTime);

      res.json({
        success: true,
        data: {
          metrics,
          topLinks,
          recentActivity,
          trends,
          systemStatus,
        },
      });
    } catch (error) {
      log.error(error, { action: "dashboard_overview" });
      next(error);
    }
  }

  /**
   * Get real-time statistics for dashboard
   */
  static async getRealtimeStats(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      const { data: urls, error } = await supabase
        .from("urls")
        .select("id, click_count")
        .eq("user_id", userId);

      if (error) throw error;

      const urlIds = urls.map((u) => u.id);

      // Get clicks in last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: recentClicks } = await supabase
        .from("clicks")
        .select("created_at")
        .in("url_id", urlIds)
        .gte("created_at", yesterday.toISOString());

      // Get clicks in last hour
      const lastHour = new Date();
      lastHour.setHours(lastHour.getHours() - 1);

      const { data: hourlyClicks } = await supabase
        .from("clicks")
        .select("created_at")
        .in("url_id", urlIds)
        .gte("created_at", lastHour.toISOString());

      // Get current online users (simplified - would need WebSocket in production)
      const onlineUsers = Math.floor(Math.random() * 50) + 10; // Placeholder

      const realtimeStats = {
        clicks_today: recentClicks?.length || 0,
        clicks_this_hour: hourlyClicks?.length || 0,
        active_links: urls.filter((u) => u.click_count > 0).length,
        online_users: onlineUsers,
        click_rate_per_minute: ((hourlyClicks?.length || 0) / 60).toFixed(1),
      };

      log.performance("realtime_stats", Date.now() - startTime);

      res.json({ success: true, data: realtimeStats });
    } catch (error) {
      log.error(error, { action: "realtime_stats" });
      next(error);
    }
  }

  /**
   * Get chart data for dashboard visualizations
   */
  static async getChartData(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      const { type = "clicks", period = "30d" } = req.query;

      if (!userId) throw new UnauthorizedError("Not authenticated");

      const { data: urls, error } = await supabase
        .from("urls")
        .select("id")
        .eq("user_id", userId);

      if (error) throw error;

      const urlIds = urls.map((u) => u.id);

      let chartData = {};

      switch (type) {
        case "clicks":
          chartData = await this.getClicksChartData(urlIds, period);
          break;
        case "growth":
          chartData = await this.getGrowthChartData(urlIds, period);
          break;
        case "devices":
          chartData = await this.getDevicesChartData(urlIds);
          break;
        case "geography":
          chartData = await this.getGeographyChartData(urlIds);
          break;
        default:
          chartData = await this.getClicksChartData(urlIds, period);
      }

      log.performance("chart_data", Date.now() - startTime);

      res.json({ success: true, data: chartData });
    } catch (error) {
      log.error(error, { action: "chart_data" });
      next(error);
    }
  }

  /**
   * Get recent activity feed (standalone endpoint)
   */
  static async getRecentActivity(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      // Get user's URLs
      const { data: urls, error: urlsError } = await supabase
        .from("urls")
        .select("id, short_code, original_url, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (urlsError) throw urlsError;

      const urlIds = urls.map((u) => u.id);

      // Get recent clicks
      const { data: clicks, error: clicksError } = await supabase
        .from("clicks")
        .select("*, urls!inner(short_code, original_url)")
        .in("url_id", urlIds)
        .order("created_at", { ascending: false })
        .limit(15);

      if (clicksError) throw clicksError;

      const activities = this.formatRecentActivity(urls, clicks || []);

      log.performance("recent_activity", Date.now() - startTime);

      res.json({
        success: true,
        data: {
          activities,
          total: activities.length,
        },
      });
    } catch (error) {
      log.error(error, { action: "get_recent_activity" });
      next(error);
    }
  }

  /**
   * Get detailed performance metrics
   */
  static async getPerformanceMetrics(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      if (!userId) throw new UnauthorizedError("Not authenticated");

      const { data: urls } = await supabase
        .from("urls")
        .select("id, click_count, created_at, last_clicked_at, is_active")
        .eq("user_id", userId);

      const { data: allClicks } = await supabase
        .from("clicks")
        .select("created_at, device_type, country")
        .in(
          "url_id",
          urls.map((u) => u.id)
        );

      const metrics = {
        total_links: urls.length,
        active_links: urls.filter((u) => u.is_active).length,
        total_clicks: urls.reduce((sum, u) => sum + (u.click_count || 0), 0),
        avg_clicks_per_link: urls.length
          ? (
              urls.reduce((sum, u) => sum + (u.click_count || 0), 0) /
              urls.length
            ).toFixed(2)
          : 0,
        top_performing_link: [...urls].sort(
          (a, b) => (b.click_count || 0) - (a.click_count || 0)
        )[0],
        clicks_this_month:
          allClicks?.filter((c) => {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return new Date(c.created_at) >= monthAgo;
          }).length || 0,
        unique_countries: new Set(
          allClicks?.map((c) => c.country).filter(Boolean)
        ).size,
        top_device: this.getMostCommon(allClicks || [], "device_type"),
        top_country: this.getMostCommon(allClicks || [], "country"),
      };

      log.performance("performance_metrics", Date.now() - startTime);

      res.json({ success: true, data: metrics });
    } catch (error) {
      log.error(error, { action: "performance_metrics" });
      next(error);
    }
  }

  /**
   * Export dashboard report
   */
  static async exportDashboardReport(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const userId = req.user?.id;
      const { format = "json", period = "30d" } = req.query;

      if (!userId) throw new UnauthorizedError("Not authenticated");

      // Fetch overview data (reuse existing logic)
      const { data: urls } = await supabase
        .from("urls")
        .select("*")
        .eq("user_id", userId);

      const { data: clicks } = await supabase
        .from("clicks")
        .select("*")
        .in(
          "url_id",
          urls.map((u) => u.id)
        );

      const reportData = {
        generated_at: new Date().toISOString(),
        period,
        summary: this.calculateMetrics(urls),
        topLinks: urls
          .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
          .slice(0, 10),
        clicksByDate: await this.getClicksChartData(
          urls.map((u) => u.id),
          period
        ),
        deviceBreakdown: await this.getDevicesChartData(urls.map((u) => u.id)),
        geography: await this.getGeographyChartData(urls.map((u) => u.id)),
      };

      log.business("dashboard_export", { userId, format, period });

      if (format === "json") {
        res.json({ success: true, data: reportData });
      } else if (format === "csv") {
        // Simple CSV generation (you can improve this with a library like json2csv)
        const csv = this.convertToCSV(reportData.topLinks);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="dashboard_report_${period}.csv"`
        );
        return res.send(csv);
      } else {
        // pdf - placeholder (use pdfkit or puppeteer in production)
        return res.status(501).json({
          success: false,
          message: "PDF export is not implemented yet.",
        });
      }

      log.performance("export_report", Date.now() - startTime);
    } catch (error) {
      log.error(error, { action: "export_dashboard_report" });
      next(error);
    }
  }

  // ==================== Helper Methods ====================

  static formatRecentActivity(urls, clicks) {
    const activities = [];

    urls.forEach((url) => {
      activities.push({
        type: "url_created",
        timestamp: url.created_at,
        message: `Short link created: ${url.short_code}`,
        data: { shortCode: url.short_code },
      });
    });

    clicks.forEach((click) => {
      activities.push({
        type: "click",
        timestamp: click.created_at,
        message: `Clicked: ${click.urls?.short_code}`,
        data: {
          shortCode: click.urls?.short_code,
          country: click.country,
          device: click.device_type,
        },
      });
    });

    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);
  }

  static getMostCommon(items, key) {
    const count = {};
    items.forEach((item) => {
      const value = item[key] || "Unknown";
      count[value] = (count[value] || 0) + 1;
    });

    return (
      Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown"
    );
  }

  static convertToCSV(data) {
    if (!data.length) return "No data";
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((value) => `"${value}"`)
        .join(",")
    );
    return [headers, ...rows].join("\n");
  }
  // Helper methods
  static calculateMetrics(urls) {
    const totalClicks = urls.reduce(
      (sum, url) => sum + (url.click_count || 0),
      0
    );
    const activeUrls = urls.filter((u) => u.is_active).length;
    const inactiveUrls = urls.filter((u) => !u.is_active).length;

    // Calculate click growth (compare last 7 days vs previous 7 days)
    const now = new Date();
    const lastWeek = new Date(now.setDate(now.getDate() - 7));
    const twoWeeksAgo = new Date(now.setDate(now.getDate() - 7));

    const recentUrls = urls.filter((u) => new Date(u.created_at) >= lastWeek);
    const olderUrls = urls.filter(
      (u) =>
        new Date(u.created_at) >= twoWeeksAgo &&
        new Date(u.created_at) < lastWeek
    );

    const recentClicks = recentUrls.reduce(
      (sum, u) => sum + (u.click_count || 0),
      0
    );
    const olderClicks = olderUrls.reduce(
      (sum, u) => sum + (u.click_count || 0),
      0
    );

    const clickGrowth =
      olderClicks > 0
        ? (((recentClicks - olderClicks) / olderClicks) * 100).toFixed(1)
        : 100;

    return {
      total_links: urls.length,
      active_links: activeUrls,
      inactive_links: inactiveUrls,
      total_clicks: totalClicks,
      average_ctr: activeUrls > 0 ? (totalClicks / activeUrls).toFixed(1) : 0,
      click_growth: clickGrowth,
      creation_rate: urls.length > 0 ? (urls.length / 30).toFixed(1) : 0, // per day average
    };
  }

  static getRecentActivity(urls, clicks) {
    const activities = [];

    // Add URL creation activities
    urls.slice(0, 5).forEach((url) => {
      activities.push({
        type: "url_created",
        timestamp: url.created_at,
        data: {
          shortCode: url.short_code,
          originalUrl: url.original_url.substring(0, 50),
        },
      });
    });

    // Add click activities
    clicks.slice(0, 10).forEach((click) => {
      activities.push({
        type: "click",
        timestamp: click.created_at,
        data: {
          shortCode: click.urls?.short_code,
          originalUrl: click.urls?.original_url?.substring(0, 50),
        },
      });
    });

    // Sort by timestamp and return latest 10
    return activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
  }

  static getTrendsData(urls) {
    const trends = {
      clicks_timeline: {},
      creation_timeline: {},
    };

    // Get last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      trends.clicks_timeline[dateStr] = 0;
      trends.creation_timeline[dateStr] = 0;
    }

    urls.forEach((url) => {
      const createdDate = new Date(url.created_at).toISOString().split("T")[0];
      if (trends.creation_timeline[createdDate]) {
        trends.creation_timeline[createdDate]++;
      }

      // We would need clicks data with dates for accurate timeline
      // This is simplified
    });

    return trends;
  }

  static async getSystemStatus(userId) {
    // Get quota usage
    const { data: urls } = await supabase
      .from("urls")
      .select("id")
      .eq("user_id", userId);

    const { data: user } = await supabase
      .from("users")
      .select("plan")
      .eq("id", userId)
      .single();

    const quotas = {
      free: { links: 100, clicks_per_month: 10000 },
      pro: { links: 1000, clicks_per_month: 100000 },
      business: { links: 10000, clicks_per_month: 1000000 },
    };

    const userPlan = user?.plan || "free";
    const quota = quotas[userPlan];

    return {
      status: "operational",
      quota_usage: {
        links_used: urls?.length || 0,
        links_limit: quota.links,
        links_percentage: (((urls?.length || 0) / quota.links) * 100).toFixed(
          1
        ),
      },
      plan: userPlan,
      last_backup: new Date().toISOString(),
    };
  }

  static async getClicksChartData(urlIds, period) {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: clicks } = await supabase
      .from("clicks")
      .select("created_at")
      .in("url_id", urlIds)
      .gte("created_at", startDate.toISOString());

    const chartData = {};
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      chartData[dateStr] = 0;
    }

    clicks?.forEach((click) => {
      const dateStr = new Date(click.created_at).toISOString().split("T")[0];
      if (chartData[dateStr] !== undefined) {
        chartData[dateStr]++;
      }
    });

    return {
      labels: Object.keys(chartData),
      values: Object.values(chartData),
      total: Object.values(chartData).reduce((a, b) => a + b, 0),
    };
  }

  static async getGrowthChartData(urlIds, period) {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: urls } = await supabase
      .from("urls")
      .select("created_at")
      .in("id", urlIds)
      .gte("created_at", startDate.toISOString());

    const chartData = {};
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      chartData[dateStr] = 0;
    }

    urls?.forEach((url) => {
      const dateStr = new Date(url.created_at).toISOString().split("T")[0];
      if (chartData[dateStr] !== undefined) {
        chartData[dateStr]++;
      }
    });

    return {
      labels: Object.keys(chartData),
      values: Object.values(chartData),
      total: urls?.length || 0,
    };
  }

  static async getDevicesChartData(urlIds) {
    const { data: clicks } = await supabase
      .from("clicks")
      .select("device_type")
      .in("url_id", urlIds);

    const devices = {};
    clicks?.forEach((click) => {
      const device = click.device_type || "Unknown";
      devices[device] = (devices[device] || 0) + 1;
    });

    return {
      labels: Object.keys(devices),
      values: Object.values(devices),
      total: clicks?.length || 0,
    };
  }

  static async getGeographyChartData(urlIds) {
    const { data: clicks } = await supabase
      .from("clicks")
      .select("country")
      .in("url_id", urlIds);

    const countries = {};
    clicks?.forEach((click) => {
      const country = click.country || "Unknown";
      countries[country] = (countries[country] || 0) + 1;
    });

    const sorted = Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: sorted.map(([country]) => country),
      values: sorted.map(([, count]) => count),
      total: clicks?.length || 0,
    };
  }
}
