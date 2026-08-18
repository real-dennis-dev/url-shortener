import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 text-xl font-bold text-indigo-700">YourApp</div>

        <nav className="flex-1 px-4 space-y-1">
          <Link
            to="/dashboard"
            className="block px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium"
          >
            Overview
          </Link>
          {/* Add more links later */}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="text-sm text-slate-600 mb-2 truncate">
            {user?.email || user?.name || "User"}
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4">
          <h1 className="text-xl font-semibold text-slate-800">Dashboard</h1>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
