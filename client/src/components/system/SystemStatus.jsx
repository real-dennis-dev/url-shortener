import { useEffect } from "react";
import { useSystem } from "../../hooks/useSystem";
import { LoadingSpinner, ErrorState, Badge, Card } from "../common";

const StatusCard = ({ title, value, icon, color = "primary" }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-neutral-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <span className="text-3xl">{icon}</span>
    </div>
  </div>
);

export default function SystemStatus() {
  const {
    status,
    loading,
    error,
    fetchSystemStatus,
    startAutoRefresh,
    stopAutoRefresh,
    autoRefresh,
  } = useSystem();

  useEffect(() => {
    fetchSystemStatus();
    startAutoRefresh();
    return () => stopAutoRefresh();
  }, [fetchSystemStatus, startAutoRefresh, stopAutoRefresh]);

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load system status"
        description={error}
        onRetry={fetchSystemStatus}
      />
    );
  }

  if (!status) return null;

  const { memory, cpu, activeUsers, activeSessions, uptime } = status;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Status</h1>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <span>Auto-refresh:</span>
          <Badge variant={autoRefresh ? "success" : "neutral"}>
            {autoRefresh ? "On" : "Off"}
          </Badge>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatusCard
          title="Active Users"
          value={activeUsers || 0}
          icon="👤"
          color="primary"
        />
        <StatusCard
          title="Active Sessions"
          value={activeSessions || 0}
          icon="🔐"
          color="info"
        />
        <StatusCard
          title="Memory Usage"
          value={`${memory?.usagePercent || "0%"}`}
          icon="💾"
          color={parseInt(memory?.usagePercent) > 80 ? "error" : "success"}
        />
        <StatusCard
          title="CPU Usage"
          value={`${cpu?.usage || 0}%`}
          icon="⚡"
          color={cpu?.usage > 80 ? "error" : "success"}
        />
      </div>

      {/* Uptime */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm text-neutral-500 mb-2">Uptime</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-600">Process</span>
              <span className="font-medium">
                {uptime?.process ? formatUptime(uptime.process) : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">System</span>
              <span className="font-medium">
                {uptime?.system ? formatUptime(uptime.system) : "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm text-neutral-500 mb-2">System Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-600">Platform</span>
              <span className="font-medium">
                {status.system?.platform || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Architecture</span>
              <span className="font-medium">
                {status.system?.arch || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Hostname</span>
              <span className="font-medium">
                {status.system?.hostname || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Memory Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-sm text-neutral-500 mb-4">Memory Details</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-neutral-500">Total</p>
            <p className="font-medium">{formatBytes(memory?.total)}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Free</p>
            <p className="font-medium">{formatBytes(memory?.free)}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Used</p>
            <p className="font-medium">{formatBytes(memory?.used)}</p>
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-sm text-neutral-500 text-right">
        Last updated:{" "}
        {status.timestamp ? new Date(status.timestamp).toLocaleString() : "N/A"}
      </div>
    </div>
  );
}

// Helper functions
function formatBytes(bytes) {
  if (!bytes) return "N/A";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

function formatUptime(seconds) {
  if (!seconds) return "N/A";
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
