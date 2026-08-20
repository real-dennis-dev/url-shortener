import { Outlet } from "react-router-dom";
import { Link, useLocation } from "react-router-dom";
import { useSystem } from "../../hooks/useSystem";
import { Button, Badge } from "../common";

const navigationItems = [
  { label: "Overview", path: "/system/overview", icon: "📊" },
  { label: "Health", path: "/system/health", icon: "❤️" },
  { label: "Settings", path: "/system/settings", icon: "⚙️" },
  { label: "Metrics", path: "/system/metrics", icon: "📈" },
  { label: "Logs", path: "/system/logs", icon: "📋" },
];

export default function SystemDashboard() {
  const location = useLocation();
  const { maintenanceMode, maintenanceMessage, isAdmin } = useSystem();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-error mb-2">Access Denied</h2>
          <p className="text-neutral-500">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Maintenance Banner */}
      {maintenanceMode && (
        <div className="mb-6 bg-warning/10 border border-warning rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="warning" size="lg">
                Maintenance Mode
              </Badge>
              {maintenanceMessage && (
                <p className="text-neutral-700 mt-2">{maintenanceMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
        {navigationItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant={location.pathname === item.path ? "primary" : "ghost"}
              size="sm"
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Content */}
      <Outlet />
    </div>
  );
}
