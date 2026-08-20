import { useEffect } from "react";
import { useSystem } from "../../hooks/useSystem";
import { LoadingSpinner, ErrorState, Button } from "../common";

export default function SystemMetrics() {
  const {
    metrics,
    loading,
    error,
    fetchMetrics,
    startAutoRefresh,
    stopAutoRefresh,
  } = useSystem();

  useEffect(() => {
    fetchMetrics();
    startAutoRefresh();
    return () => stopAutoRefresh();
  }, [fetchMetrics, startAutoRefresh, stopAutoRefresh]);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load metrics"
        description={error}
        onRetry={fetchMetrics}
      />
    );
  }

  if (!metrics) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Metrics</h1>
        <Button variant="outline" size="sm" onClick={fetchMetrics}>
          Refresh
        </Button>
      </div>

      {/* Memory Metrics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-sm text-neutral-500 mb-4">Memory Usage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-neutral-500">Total</p>
            <p className="font-medium">{metrics.memory?.totalGB || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Free</p>
            <p className="font-medium">{metrics.memory?.freeGB || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Used</p>
            <p className="font-medium">{metrics.memory?.usedGB || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Usage</p>
            <p className="font-medium text-error">
              {metrics.memory?.usagePercent || "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* CPU Metrics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-sm text-neutral-500 mb-4">CPU Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-neutral-500">Cores</p>
            <p className="font-medium">{metrics.cpu?.cores || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Model</p>
            <p className="font-medium text-sm">{metrics.cpu?.model || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Speed</p>
            <p className="font-medium">
              {metrics.cpu?.speed ? `${metrics.cpu.speed} MHz` : "N/A"}
            </p>
          </div>
        </div>

        {/* Load Average */}
        {metrics.cpu?.loadAverage && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-neutral-500 mb-2">Load Average</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-neutral-500">1 min</p>
                <p className="font-medium">
                  {metrics.cpu.loadAverage["1min"] || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">5 min</p>
                <p className="font-medium">
                  {metrics.cpu.loadAverage["5min"] || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">15 min</p>
                <p className="font-medium">
                  {metrics.cpu.loadAverage["15min"] || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Database Metrics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-sm text-neutral-500 mb-4">Database</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-neutral-500">Status</p>
            <p className="font-medium">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  metrics.database?.status === "healthy"
                    ? "bg-success"
                    : "bg-error"
                }`}
              />
              {metrics.database?.status || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Connections</p>
            <p className="font-medium">{metrics.database?.connections || 0}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Available</p>
            <p className="font-medium">{metrics.database?.available || 0}</p>
          </div>
        </div>
      </div>

      {/* Cache Metrics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-sm text-neutral-500 mb-4">Cache</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-neutral-500">Status</p>
            <p className="font-medium">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  metrics.cache?.status === "healthy"
                    ? "bg-success"
                    : "bg-error"
                }`}
              />
              {metrics.cache?.status || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Hits</p>
            <p className="font-medium">{metrics.cache?.hits || 0}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Misses</p>
            <p className="font-medium">{metrics.cache?.misses || 0}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Hit Rate</p>
            <p className="font-medium">{metrics.cache?.hitRate || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Process Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm text-neutral-500 mb-4">Process Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-neutral-500">PID</p>
            <p className="font-medium">{metrics.process?.pid || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Version</p>
            <p className="font-medium">{metrics.process?.version || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Platform</p>
            <p className="font-medium">{metrics.process?.platform || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Uptime</p>
            <p className="font-medium">
              {metrics.process?.uptime
                ? formatUptime(metrics.process.uptime)
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="text-sm text-neutral-500 text-right mt-4">
        Last updated:{" "}
        {metrics.timestamp
          ? new Date(metrics.timestamp).toLocaleString()
          : "N/A"}
      </div>
    </div>
  );
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
