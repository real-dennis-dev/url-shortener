import { useEffect } from "react";
import { useUserContext } from "./UserProvider";
import { LoadingSpinner, ErrorState, ProgressBar } from "../common";

export default function UserStatistics() {
  const { statistics, loading, error, fetchStatistics } = useUserContext();

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load statistics"
        description={error}
        onRetry={fetchStatistics}
      />
    );
  }

  if (!statistics) {
    return null;
  }

  const { overview, urlBreakdown, recentActivity, topUrls, userInfo } =
    statistics;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Statistics</h1>
        <p className="text-neutral-500 mt-1">
          Overview of your account performance
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-neutral-500">Total URLs</p>
          <p className="text-2xl font-bold text-primary-600">
            {overview.totalUrls || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-neutral-500">Active URLs</p>
          <p className="text-2xl font-bold text-success">
            {overview.activeUrls || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-neutral-500">Total Clicks</p>
          <p className="text-2xl font-bold text-info">
            {overview.totalClicks || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-sm text-neutral-500">Quota Used</p>
          <p className="text-2xl font-bold text-warning">
            {overview.quota?.percentage || 0}%
          </p>
        </div>
      </div>

      {/* Quota */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Quota Usage</h3>
        <ProgressBar
          value={overview.quota?.percentage || 0}
          max={100}
          variant={overview.quota?.percentage > 90 ? "error" : "primary"}
        />
        <div className="flex justify-between text-sm text-neutral-500 mt-2">
          <span>{overview.quota?.used || 0} used</span>
          <span>{overview.quota?.remaining || 0} remaining</span>
          <span>{overview.quota?.total || 0} total</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* URL Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">URL Status Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-600">Active</span>
              <span className="font-medium text-success">
                {urlBreakdown?.active || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Inactive</span>
              <span className="font-medium text-neutral-500">
                {urlBreakdown?.inactive || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Blocked</span>
              <span className="font-medium text-error">
                {urlBreakdown?.blocked || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Flagged</span>
              <span className="font-medium text-warning">
                {urlBreakdown?.flagged || 0}
              </span>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Account Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-600">Plan</span>
              <span className="font-medium capitalize">
                {userInfo?.plan || "Free"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Joined</span>
              <span className="font-medium">
                {userInfo?.joinedDate
                  ? new Date(userInfo.joinedDate).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <div>
                  <span className="font-medium">{activity.date}</span>
                </div>
                <span className="text-primary-600 font-medium">
                  {activity.clicks} clicks
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top URLs */}
      {topUrls && topUrls.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-semibold mb-3">Top Performing URLs</h3>
          <div className="space-y-3">
            {topUrls.map((url) => (
              <div
                key={url.id}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {url.title || url.originalUrl}
                  </p>
                  <p className="text-sm text-neutral-500 truncate">
                    {url.shortCode}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <span className="font-medium text-primary-600">
                    {url.clickCount} clicks
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
