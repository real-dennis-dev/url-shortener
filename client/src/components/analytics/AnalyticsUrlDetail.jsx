import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAnalyticsContext } from "./AnalyticsProvider";
import {
  Button,
  Badge,
  LoadingSpinner,
  ErrorState,
  DatePicker,
  Dropdown,
  DropdownItem,
  Alert,
} from "../common";

export default function AnalyticsUrlDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    urlAnalytics,
    loading,
    error,
    dateRange,
    updateDateRange,
    fetchUrlAnalytics,
    exportAnalytics,
    clearError,
  } = useAnalyticsContext();

  const [localDateRange, setLocalDateRange] = useState(dateRange);
  const [filters, setFilters] = useState({
    deviceType: "",
    country: "",
    browser: "",
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUrlAnalytics(id);
    }
  }, [id]);

  const handleApplyFilter = () => {
    updateDateRange(localDateRange);
    fetchUrlAnalytics(id, localDateRange, filters);
  };

  const handleReset = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const defaultRange = {
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
    setLocalDateRange(defaultRange);
    setFilters({ deviceType: "", country: "", browser: "" });
    updateDateRange(defaultRange);
    fetchUrlAnalytics(id, defaultRange, {});
  };

  const handleExport = async (format) => {
    setExporting(true);
    await exportAnalytics(id, format);
    setExporting(false);
  };

  if (loading && !urlAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load URL analytics"
        description={error}
        onRetry={() => {
          clearError();
          fetchUrlAnalytics(id);
        }}
      />
    );
  }

  if (!urlAnalytics) {
    return null;
  }

  const {
    url,
    summary,
    devices,
    browsers,
    countries,
    referrers,
    timeline,
    recentClicks,
  } = urlAnalytics;

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/analytics/overview">
          <Button variant="ghost" size="sm">
            ← Back to Overview
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900 truncate">
          {url?.title || url?.original_url || "URL Analytics"}
        </h1>
      </div>

      {/* URL Info */}
      {url && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-neutral-500">Short URL:</span>
              <a
                href={url.short_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-primary-600 hover:underline"
              >
                {url.short_code}
              </a>
            </div>
            <div className="truncate">
              <span className="text-neutral-500">Original URL:</span>
              <span className="ml-2">{url.original_url}</span>
            </div>
            <div>
              <span className="text-neutral-500">Created:</span>
              <span className="ml-2">
                {new Date(url.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-neutral-500">Total Clicks</p>
            <p className="text-2xl font-bold text-primary-600">
              {summary.totalClicks || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-neutral-500">Unique Visitors</p>
            <p className="text-2xl font-bold text-success">
              {summary.uniqueVisitors || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-neutral-500">Avg. Clicks/Day</p>
            <p className="text-2xl font-bold text-info">
              {(summary.averageClicksPerDay || 0).toFixed(1)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-sm text-neutral-500">Bounce Rate</p>
            <p className="text-2xl font-bold text-warning">
              {(summary.bounceRate || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Start Date
            </label>
            <DatePicker
              value={localDateRange.startDate}
              onChange={(e) =>
                setLocalDateRange({
                  ...localDateRange,
                  startDate: e.target.value,
                })
              }
              type="date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              End Date
            </label>
            <DatePicker
              value={localDateRange.endDate}
              onChange={(e) =>
                setLocalDateRange({
                  ...localDateRange,
                  endDate: e.target.value,
                })
              }
              type="date"
            />
          </div>
          <div>
            <Button variant="primary" onClick={handleApplyFilter}>
              Apply
            </Button>
            <Button variant="outline" className="ml-2" onClick={handleReset}>
              Reset
            </Button>
          </div>
          <div className="ml-auto">
            <Dropdown
              trigger={
                <Button variant="outline" size="sm" loading={exporting}>
                  Export Data
                </Button>
              }
            >
              <DropdownItem onClick={() => handleExport("csv")}>
                CSV
              </DropdownItem>
              <DropdownItem onClick={() => handleExport("json")}>
                JSON
              </DropdownItem>
              <DropdownItem onClick={() => handleExport("excel")}>
                Excel
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      {timeline && timeline.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Click Timeline</h3>
          <div className="h-48 flex items-end justify-between gap-1">
            {timeline.map((item, index) => {
              const maxValue = Math.max(...timeline.map((t) => t.clicks), 1);
              const height = (item.clicks / maxValue) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-primary-500 rounded-t transition-all duration-300 hover:bg-primary-600"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <span className="text-xs text-neutral-500 mt-1 truncate w-full text-center">
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Device & Browser Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {devices && devices.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold mb-3">Devices</h4>
            {devices.map((device) => (
              <div
                key={device.name}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm">{device.name}</span>
                <Badge variant="info">{device.value}</Badge>
              </div>
            ))}
          </div>
        )}
        {browsers && browsers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold mb-3">Browsers</h4>
            {browsers.map((browser) => (
              <div
                key={browser.name}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm">{browser.name}</span>
                <Badge variant="primary">{browser.value}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Countries & Referrers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {countries && countries.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold mb-3">Top Countries</h4>
            {countries.map((country) => (
              <div
                key={country.name}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm">{country.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-neutral-500">
                    {country.visits} visits
                  </span>
                  <Badge variant="success">
                    {country.uniqueVisitors} unique
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        {referrers && referrers.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="font-semibold mb-3">Top Referrers</h4>
            {referrers.map((referrer) => (
              <div
                key={referrer.referrer_domain}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm truncate">
                  {referrer.referrer_domain}
                </span>
                <Badge variant="warning">{referrer.count} clicks</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Clicks */}
      {recentClicks && recentClicks.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
          <div className="px-6 py-4 border-b">
            <h4 className="font-semibold">Recent Clicks</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600">
                    Location
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600">
                    Device
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600">
                    Browser
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {recentClicks.slice(0, 20).map((click, index) => (
                  <tr key={index} className="hover:bg-neutral-50">
                    <td className="px-4 py-2 text-sm">
                      {new Date(click.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {click.location || "Unknown"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {click.device || "Unknown"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {click.browser || "Unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
