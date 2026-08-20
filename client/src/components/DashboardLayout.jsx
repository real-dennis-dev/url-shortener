import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNotificationContext } from "../components/notifications/NotificationProvider";
import {
  HomeIcon,
  LinkIcon,
  UploadIcon,
  BarChart3Icon,
  BellIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  ChevronDownIcon,
  ShieldIcon,
  ActivityIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "./common/Button";
import { Badge } from "./common/Badge";

// Navigation configuration
const navigationItems = [
  {
    label: "Dashboard",
    icon: HomeIcon,
    path: "/dashboard",
  },
  {
    label: "URLs",
    icon: LinkIcon,
    path: "/url/list",
    children: [
      {
        label: "All URLs",
        path: "/url/list",
      },
      {
        label: "Create URL",
        path: "/url/create",
      },
      {
        label: "Bulk Upload",
        path: "/bulk-upload/uploads",
      },
    ],
  },
  {
    label: "Bulk Upload",
    icon: UploadIcon,
    path: "/bulk-upload/uploads",
    children: [
      {
        label: "Uploads",
        path: "/bulk-upload/uploads",
      },
      {
        label: "Statistics",
        path: "/bulk-upload/stats",
      },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart3Icon,
    path: "/analytics",
  },
  {
    label: "Notifications",
    icon: BellIcon,
    path: "/notifications",
  },
  {
    label: "Activity",
    icon: ActivityIcon,
    path: "/activity",
  },
  {
    label: "Settings",
    icon: SettingsIcon,
    path: "/settings/profile",
    children: [
      {
        label: "Profile",
        path: "/settings/profile",
      },
      {
        label: "Security",
        path: "/settings/security",
      },
      {
        label: "Preferences",
        path: "/settings/preferences",
      },
    ],
  },
];

// Admin navigation items (only visible to admins)
const adminNavigationItems = [
  {
    label: "Admin",
    icon: ShieldIcon,
    path: "/admin/users",
    children: [
      {
        label: "User Management",
        path: "/admin/users",
      },
      {
        label: "Notification Admin",
        path: "/admin/notifications",
      },
      {
        label: "System Logs",
        path: "/admin/logs",
      },
    ],
  },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotificationContext();

  // Check if user is admin
  useEffect(() => {
    if (user?.role === "admin" || user?.isAdmin) {
      setIsAdmin(true);
    }
  }, [user]);

  // Get all navigation items based on user role
  const allNavItems = [...navigationItems];
  if (isAdmin) {
    allNavItems.push(...adminNavigationItems);
  }

  const toggleExpanded = (path) => {
    setExpandedItems((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const isChildActive = (children) => {
    if (!children) return false;
    return children.some((child) => isActive(child.path));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const renderNavItem = (item, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.path] || isChildActive(item.children);
    const isItemActive = isActive(item.path);

    return (
      <div key={item.path}>
        <Link
          to={hasChildren ? "#" : item.path}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault();
              toggleExpanded(item.path);
            }
          }}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
            isItemActive || isChildActive(item.children)
              ? "bg-primary-500 text-white"
              : "text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
          } ${depth > 0 ? "ml-4" : ""}`}
        >
          {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
          <span className="flex-1 text-sm font-medium">{item.label}</span>
          {item.label === "Notifications" && unreadCount > 0 && (
            <Badge variant="error" size="sm">
              {unreadCount}
            </Badge>
          )}
          {hasChildren && (
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          )}
        </Link>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children.map((child) => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-neutral-200 z-50 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-4 border-b border-neutral-200">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-neutral-900">Shortify</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
          {allNavItems.map((item) => renderNavItem(item))}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            fullWidth
            onClick={handleLogout}
            className="text-error hover:bg-error/10"
          >
            <LogOutIcon className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100"
            >
              {sidebarOpen ? (
                <XIcon className="w-5 h-5" />
              ) : (
                <MenuIcon className="w-5 h-5" />
              )}
            </button>
            <h2 className="text-lg font-semibold text-neutral-900">
              {allNavItems.find((item) => isActive(item.path))?.label ||
                "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/notifications">
              <button className="p-2 rounded-lg hover:bg-neutral-100 relative">
                <BellIcon className="w-5 h-5 text-neutral-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-error text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </Link>
            <Link to="/settings/profile">
              <button className="p-2 rounded-lg hover:bg-neutral-100">
                <UserIcon className="w-5 h-5 text-neutral-600" />
              </button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
