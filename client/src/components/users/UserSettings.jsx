import { Outlet, Link, useLocation } from "react-router-dom";
import { UserProvider } from "./UserProvider";

function SettingsNavigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: "/settings/profile", label: "Profile" },
    { path: "/settings/security", label: "Security" },
    { path: "/settings/preferences", label: "Preferences" },
  ];

  return (
    <div className="border-b border-neutral-200 mb-6">
      <nav className="flex gap-6">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              currentPath === item.path
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function UserSettings() {
  return (
    <UserProvider>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
          <p className="text-neutral-500 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <SettingsNavigation />

        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </UserProvider>
  );
}
