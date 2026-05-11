import { supabase } from "../config/supabase.js";
import { createRequestContextLogger } from "../utils/logger.js";
import { NotFoundError, BadRequestError } from "../errors/customErrors.js";
import useragent from "useragent";
import geoip from "geoip-lite";

export class RedirectController {
  /**
   * Handle redirection and log analytics
   */
  static async redirect(req, res, next) {
    const log = createRequestContextLogger(req);
    const startTime = Date.now();

    try {
      const { shortCode } = req.params;

      // Get URL with analytics
      const { data: url, error } = await supabase
        .from("urls")
        .select("id, original_url, is_active, expires_at, password, user_id")
        .eq("short_code", shortCode)
        .single();

      if (error || !url) {
        throw new NotFoundError("URL not found");
      }

      // Check if URL is active
      if (!url.is_active) {
        log.business("inactive_url_accessed", { shortCode });
        throw new BadRequestError("This URL has been deactivated");
      }

      // Check expiration
      if (url.expires_at && new Date(url.expires_at) < new Date()) {
        log.business("expired_url_accessed", { shortCode });
        throw new BadRequestError("This URL has expired");
      }

      // Prepare analytics data
      const userAgent = req.get("user-agent");
      const agent = useragent.parse(userAgent);
      const ip = req.ip || req.connection.remoteAddress;
      const geo = geoip.lookup(ip);

      const clickData = {
        url_id: url.id,
        ip_address: ip,
        user_agent: userAgent,
        device_type: agent.device.toString(),
        browser: agent.family,
        os: agent.os.toString(),
        referrer: req.get("referrer") || req.get("referer"),
        country: geo?.country || "Unknown",
        city: geo?.city || "Unknown",
        region: geo?.region || "Unknown",
      };

      // Insert click analytics (async, don't await)
      supabase
        .from("clicks")
        .insert([clickData])
        .then((error) => {
          if (error) log.error(error, { action: "log_click" });
        })
        .catch((err) => log.error(err, { action: "log_click_error" }));

      // Update click count
      supabase
        .rpc("increment_click_count", { url_id: url.id })
        .then((error) => {
          if (error) log.error(error, { action: "increment_click_count" });
        });

      // Update last clicked at
      supabase
        .from("urls")
        .update({ last_clicked_at: new Date() })
        .eq("id", url.id)
        .then((error) => {
          if (error) log.error(error, { action: "update_last_clicked" });
        });

      log.business("url_redirected", {
        shortCode,
        urlId: url.id,
        deviceType: clickData.device_type,
        browser: clickData.browser,
        country: clickData.country,
      });

      log.performance("redirect", Date.now() - startTime);

      // Redirect to original URL
      res.redirect(301, url.original_url);
    } catch (error) {
      log.error(error, { action: "redirect_handling" });
      next(error);
    }
  }

  /**
   * Get click analytics for a specific URL (for API access)
   */
  static async getUrlAnalytics(req, res, next) {
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

      if (urlError || !url) {
        throw new NotFoundError("URL not found");
      }

      if (url.user_id !== userId && req.user?.role !== "admin") {
        throw new ForbiddenError("Access denied");
      }

      // Get comprehensive analytics
      const [
        totalClicks,
        uniqueVisitors,
        deviceBreakdown,
        browserBreakdown,
        clicksByDate,
      ] = await Promise.all([
        supabase
          .from("clicks")
          .select("*", { count: "exact", head: true })
          .eq("url_id", url.id),
        supabase
          .from("clicks")
          .select("ip_address", { count: "exact", head: true })
          .eq("url_id", url.id),
        supabase.from("clicks").select("device_type").eq("url_id", url.id),
        supabase.from("clicks").select("browser").eq("url_id", url.id),
        supabase
          .from("clicks")
          .select("created_at")
          .eq("url_id", url.id)
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);

      const analytics = {
        total_clicks: totalClicks.count || 0,
        unique_visitors: uniqueVisitors.count || 0,
        device_breakdown: this.aggregateStats(
          deviceBreakdown.data,
          "device_type"
        ),
        browser_breakdown: this.aggregateStats(
          browserBreakdown.data,
          "browser"
        ),
        clicks_by_date: this.aggregateByDate(clicksByDate.data || []),
      };

      log.performance("get_url_analytics", Date.now() - startTime);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      log.error(error, { action: "get_url_analytics" });
      next(error);
    }
  }

  static aggregateStats(data, field) {
    if (!data) return {};
    return data.reduce((acc, item) => {
      const key = item[field] || "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  static aggregateByDate(clicks) {
    const dateMap = new Map();
    clicks.forEach((click) => {
      const date = new Date(click.created_at).toISOString().split("T")[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    return Object.fromEntries(dateMap);
  }
}
