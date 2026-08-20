import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotificationContext } from "./notifications/NotificationProvider";
import {
  ArrowUpRightIcon,
  LinkIcon,
  UsersIcon,
  EyeIcon,
  MousePointerClickIcon,
  TrendingUpIcon,
  ClockIcon,
  GlobeIcon,
} from "lucide-react";
import { Button } from "./common/Button";
import { Badge } from "./common/Badge";
import { LoadingSpinner } from "./common/LoadingSpinner";

// Mock data - replace with actual API calls
const mockStats = {
  totalLinks: 245,
  totalClicks: 12894,
  activeLinks: 189,
  clickRate: 4.7,
  dailyClicks: 342,
  weeklyGrowth: 12.5,
  topCountries: [
    { country: "United States", clicks: 4521, percentage: 35 },
    { country: "United Kingdom", clicks: 2134, percentage: 16.5 },
    { country: "Germany", clicks: 1567, percentage: 12.1 },
    { country: "Canada", clicks: 1234, percentage: 9.6 },
    { country: "Australia", clicks: 987, percentage: 7.6 },
  ],
  recentActivity: [
    {
      id: 1,
      type: "click",
      link: "https://shortify.io/abc123",
      location: "San Francisco, US",
      device: "Desktop",
      browser: "Chrome",
      timestamp: "2024-01-15T10:30:00Z",
    },
    {
      id: 2,
      type: "create",
      link: "https://shortify.io/def456",
      timestamp: "2024-01-15T09:15:00Z",
    },
    {
      id: 3,
      type: "click",
      link: "https://shortify.io/ghi789",
      location: "London, UK",
      device: "Mobile",
      browser: "Safari",
      timestamp: "2024-01-15T08:45:00Z",
    },
    {
      id: 4,
      type: "create",
      link: "https://shortify.io/jkl012",
      timestamp: "2024-01-15T08:00:00Z",
    },
    {
      id: 5,
      type: "click",
      link: "https://shortify.io/mno345",
      location: "Tokyo, JP",
      device: "Tablet",
      browser: "Firefox",
      timestamp: "2024-01-15T07:20:00Z",
    },
  ],
};

export default function DashboardHome() {
  const { user } = useAuth();
  const { unreadCount } = useNotificationContext();
  const [stats, setStats] = useState(mockStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const statCards = [
    {
      label: "Total Links",
      value: stats.totalLinks,
      icon: LinkIcon,
      color: "primary",
      change: "+12%",
    },
    {
      label: "Total Clicks",
      value: stats.totalClicks.toLocaleString(),
      icon: MousePointerClickIcon,
      color: "success",
      change: "+18%",
    },
    {
      label: "Active Links",
      value: stats.activeLinks,
      icon: EyeIcon,
      color: "info",
      change: "+5%",
    },
    {
      label: "Click Rate",
      value: `${stats.clickRate}%`,
      icon: TrendingUpIcon,
      color: "warning",
      change: "+0.8%",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
          Welcome back, {user?.name || "User"}!
        </h1>
        <p className="text-neutral-500 mt-1">
          Here's what's happening with your links today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm p-4 border border-neutral-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg bg-${stat.color}-100 flex items-center justify-center`}
              >
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs text-success font-medium">
                {stat.change}
              </span>
              <span className="text-xs text-neutral-400">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link to="/url/create">
          <Button variant="primary">
            <LinkIcon className="w-4 h-4 mr-2" />
            Create New Link
          </Button>
        </Link>
        <Link to="/bulk-upload/uploads">
          <Button variant="outline">Bulk Upload</Button>
        </Link>
        <Link to="/notifications">
          <Button variant="outline" className="relative">
            <BellIcon className="w-4 h-4 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="error" size="sm" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Top Countries
            </h3>
            <GlobeIcon className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="space-y-3">
            {stats.topCountries.map((country, index) => (
              <div key={index}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-neutral-600">{country.country}</span>
                  <span className="text-neutral-900 font-medium">
                    {country.clicks.toLocaleString()} clicks
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 rounded-full h-2 transition-all"
                    style={{ width: `${country.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link to="/analytics">
            <Button variant="ghost" size="sm" fullWidth className="mt-4">
              View Full Analytics
              <ArrowUpRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Recent Activity
            </h3>
            <ClockIcon className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-3 border-b border-neutral-100 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  {activity.type === "click" ? (
                    <MousePointerClickIcon className="w-4 h-4 text-primary-500" />
                  ) : (
                    <LinkIcon className="w-4 h-4 text-success" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900 truncate">
                    {activity.link}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                    <span>
                      {activity.type === "click" ? "Clicked" : "Created"}
                    </span>
                    {activity.location && (
                      <>
                        <span>•</span>
                        <span>{activity.location}</span>
                      </>
                    )}
                    {activity.device && (
                      <>
                        <span>•</span>
                        <span>{activity.device}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/activity">
            <Button variant="ghost" size="sm" fullWidth className="mt-4">
              View All Activity
              <ArrowUpRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
