import { useEffect } from "react";
import { useSystem } from "../../hooks/useSystem";
import { LoadingSpinner, ErrorState, Badge, Button } from "../common";

const ServiceStatus = ({ name, status, responseTime, details }) => {
  const isHealthy = status === "healthy";
  const isWarning = status === "warning";

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <div
          className={`w-3 h-3 rounded-full ${
            isHealthy ? "bg-success" : isWarning ? "bg-warning" : "bg-error"
          }`}
        />
        <div>
          <p className="font-medium capitalize">{name}</p>
          {details && <p className="text-sm text-neutral-500">{details}</p>}
        </div>
      </div>
      <div className="text-right">
        <Badge
          variant={isHealthy ? "success" : isWarning ? "warning" : "error"}
        >
          {status}
        </Badge>
        {responseTime && (
          <p className="text-sm text-neutral-500 mt-1">{responseTime}</p>
        )}
      </div>
    </div>
  );
};

export default function SystemHealth() {
  const {
    health,
    loading,
    error,
    checkHealth,
    startAutoRefresh,
    stopAutoRefresh,
  } = useSystem();

  useEffect(() => {
    checkHealth();
    startAutoRefresh();
    return () => stopAutoRefresh();
  }, [checkHealth, startAutoRefresh, stopAutoRefresh]);

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to check health"
        description={error}
        onRetry={checkHealth}
      />
    );
  }

  if (!health) return null;

  const { status, services, version, environment, uptime, unhealthyServices } =
    health;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Health</h1>
        <Button variant="outline" size="sm" onClick={checkHealth}>
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Overall Status</p>
            <Badge
              variant={
                status === "healthy"
                  ? "success"
                  : status === "degraded"
                  ? "warning"
                  : "error"
              }
              size="lg"
            >
              {status}
            </Badge>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-500">Version</p>
            <p className="font-medium">{version || "N/A"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-500">Environment</p>
            <p className="font-medium">{environment || "N/A"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-500">Uptime</p>
            <p className="font-medium">
              {uptime ? formatUptime(uptime) : "N/A"}
            </p>
          </div>
        </div>

        {unhealthyServices && unhealthyServices.length > 0 && (
          <div className="mt-4 p-3 bg-error/10 border border-error rounded-lg">
            <p className="text-sm text-error">
              ⚠️ Unhealthy services: {unhealthyServices.join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Service Statuses */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm text-neutral-500 mb-4">Service Status</h3>
        <div className="space-y-3">
          {services?.database && (
            <ServiceStatus
              name="Database"
              status={services.database.status}
              responseTime={services.database.responseTime}
              details={services.database.details}
            />
          )}
          {services?.cache && (
            <ServiceStatus
              name="Cache"
              status={services.cache.status}
              responseTime={services.cache.responseTime}
              details={services.cache.details}
            />
          )}
          {services?.queue && (
            <ServiceStatus
              name="Queue"
              status={services.queue.status}
              details={services.queue.details}
            />
          )}
          {services?.email && (
            <ServiceStatus
              name="Email Service"
              status={services.email.status}
              details={services.email.details}
            />
          )}
        </div>
      </div>

      <div className="text-sm text-neutral-500 text-right mt-4">
        Last checked:{" "}
        {health.timestamp ? new Date(health.timestamp).toLocaleString() : "N/A"}
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
