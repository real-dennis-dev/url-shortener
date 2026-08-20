import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAnalyticsContext } from "./AnalyticsProvider";
import { Button, Badge, LoadingSpinner, ErrorState, Switch } from "../common";

export default function AnalyticsRealtime() {
  const {
    realtimeData,
    loading,
    error,
    isPolling,
    startRealtimePolling,
    stopRealtimePolling,
    clearError,
  } = useAnalyticsContext();

  useEffect(() => {
    // Start polling when component mounts
    startRealtimePolling(5000);

    return () => {
      stopRealtimePolling();
    };
  }, [startRealtimePolling, stopRealtimePolling]);

  const togglePolling = () => {
    if (isPolling) {
      stopRealtimePolling();
    } else {
      startRealtimePolling(5000);
    }
  };

  if (loading && !realtimeData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load real-time data"
        description={error}
        onRetry={() => {
          clearError();
          startRealtimePolling(5000);
        }}
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Real-Time Analytics
          </h1>
          <p className="text-neutral-500 mt-1">
            Live monitoring of your URL activity
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">
              {isPolling ? "Live" : "Paused"}
            </span>
            <div
              className={`w-2 h-2 rounded-full ${
                isPolling ? "bg-success animate-pulse" : "bg-neutral-400"
              }`}
            />
          </div>
          <Switch
            checked={isPolling}
            onChange={togglePolling}
            label="Auto-refresh"
          />
          <Link to="/analytics/overview">
            <Button variant="outline" size="sm">
              ← Back
            </Button>
          </Link>
        </div>
      </div>

      {realtimeData && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-neutral-500">Active Users</p>
              <p className="text-3xl font-bold text-primary-600">
                {realtimeData.activeUsers || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-neutral-500">Clicks (Last Hour)</p>
              <p className="text-3xl font-bold text-success">
                {realtimeData.clicksLastHour || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-neutral-500">Clicks (Last Minute)</p>
              <p className="text-3xl font-bold text-info">
                {realtimeData.clicksPerMinute?.slice(-1)[0]?.clicks || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-sm text-neutral-500">Last Updated</p>
              <p className="text-sm font-medium text-neutral-700">
                {realtimeData.timestamp
                  ? new Date(realtimeData.timestamp).toLocaleTimeString()
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Clicks Per Minute Chart */}
          {realtimeData.clicksPerMinute &&
            realtimeData.clicksPerMinute.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Clicks Per Minute
                </h3>
                <div className="h-48 flex items-end justify-between gap-1">
                  {realtimeData.clicksPerMinute.map((item, index) => {
                    const maxValue = Math.max(
                      ...realtimeData.clicksPerMinute.map((c) => c.clicks),
                      1
                    );
                    const height = (item.clicks / maxValue) * 100;
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center flex-1"
                      >
                        <div
                          className="w-full bg-primary-500 rounded-t transition-all duration-300"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        <span className="text-xs text-neutral-500 mt-1 truncate w-full text-center">
                          {item.minute}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Recent Clicks */}
          {realtimeData.recentClicks &&
            realtimeData.recentClicks.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                  <Badge variant="success" size="sm">
                    Live
                  </Badge>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600">
                          Time
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600">
                          URL
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600">
                          Location
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-neutral-600">
                          Device
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {realtimeData.recentClicks.map((click, index) => (
                        <tr key={index} className="hover:bg-neutral-50">
                          <td className="px-4 py-2 text-sm">
                            {new Date(click.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-2 text-sm truncate max-w-xs">
                            {click.url_title || click.url || "Unknown"}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {click.location || "Unknown"}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {click.device || "Unknown"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}
