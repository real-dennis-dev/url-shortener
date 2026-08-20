import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAnalyticsContext } from "./AnalyticsProvider";
import {
  Button,
  Badge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
  DatePicker,
  ProgressBar,
} from "../common";

// Chart component (assuming you have a chart library like Chart.js or Recharts)
// For this example, I'll use simple divs

export default function AnalyticsOverview() {
  const {
    overviewData,
    loading,
    error,
    dateRange,
    updateDateRange,
    fetchOverview,
    getDefaultDateRange,
    clearError,
  } = useAnalyticsContext();

  const [localDateRange, setLocalDateRange] = useState(dateRange);

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleApplyFilter = () => {
    updateDateRange(localDateRange);
    fetchOverview(localDateRange);
  };

  const handleReset = () => {
    const defaultRange = getDefaultDateRange();
    setLocalDateRange(defaultRange);
    updateDateRange(defaultRange);
    fetchOverview(defaultRange);
  };

  if (loading && !overviewData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load analytics"
        description={error}
        onRetry={() => {
          clearError();
          fetchOverview();
        }}
      />
    );
  }

  if (!overviewData) {
    return (
      <EmptyState
        title="No analytics data"
        description="Start sharing your URLs to see analytics data"
        action={
          <Link to="/dashboard">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>
        }
      />
    );
  }

  const { overview, recentUrls, chartData } = overviewData;

  // Summary cards configuration
  const summaryCards = [
    {
      label: "Total URLs",
      value: overview?.totalUrls || 0,
      color: "primary",
    },
    {
      label: "Total Clicks",
      value: overview?.totalClicks || 0,
      color: "success",
    },
    {
      label: "New URLs",
      value: overview?.newUrls || 0,
      color: "info",
    },
    {
      label: "New Clicks",
      value: overview?.newClicks || 0,
      color: "warning",
    },
    {
      label: "Active URLs",
      value: overview?.activeUrls || 0,
      color: "primary",
    },
    {
      label: "Click Through Rate",
      value: `${(overview?.clickThroughRate || 0).toFixed(1)}%`,
      color: "success",
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Analytics Overview
          </h1>
          <p className="text-neutral-500 mt-1">
            Track your URL performance and audience insights
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/analytics/realtime">
            <Button variant="outline" size="sm">
              Live View
            </Button>
          </Link>
          <Link to="/analytics/export">
            <Button variant="primary" size="sm">
              Export Data
            </Button>
          </Link>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
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
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleApplyFilter}>
              Apply
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg shadow p-4 text-center"
          >
            <p className="text-xs text-neutral-500 uppercase tracking-wide">
              {card.label}
            </p>
            <p className={`text-2xl font-bold text-${card.color}-600`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart Area */}
      {chartData && chartData.labels && chartData.labels.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Click Activity</h3>
          <div className="h-64 flex items-end justify-between gap-1">
            {chartData.labels.map((label, index) => {
              const maxValue = Math.max(...chartData.clicks, 1);
              const height = (chartData.clicks[index] / maxValue) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-primary-500 rounded-t transition-all duration-300 hover:bg-primary-600"
                    style={{ height: `${Math.max(height, 2)}%` }}
                  />
                  <span className="text-xs text-neutral-500 mt-1 truncate w-full text-center">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top URLs */}
      {overview?.topUrls && overview.topUrls.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Top Performing URLs</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                    Short Code
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                    Clicks
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {overview.topUrls.map((url) => (
                  <tr key={url.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm truncate max-w-xs">
                      {url.title || "Untitled"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <code className="bg-neutral-100 px-2 py-1 rounded text-xs">
                        {url.short_code}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {url.click_count}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/analytics/url/${url.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
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
