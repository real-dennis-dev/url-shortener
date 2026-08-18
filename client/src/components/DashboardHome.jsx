import { useAuth } from "../contexts/AuthContext";

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Welcome back{user?.name ? `, ${user.name}` : ""} 👋
      </h2>
      <p className="text-slate-600 mb-8">
        Here’s what’s happening with your account today.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Account Status</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">Active</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Email</p>
          <p className="text-lg font-medium text-slate-800 mt-1 truncate">
            {user?.email || "—"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Member since</p>
          <p className="text-lg font-medium text-slate-800 mt-1">
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
