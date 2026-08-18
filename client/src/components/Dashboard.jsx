// components/dashboard/Dashboard.jsx

import React from "react";
import { useAuth } from "../contexts/AuthContext.jsx";

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome, {user?.username || "User"}
            </h1>

            <p className="text-gray-600 mt-2">{user?.email}</p>
          </div>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">
          <div className="bg-blue-50 p-5 rounded-lg">
            <h3 className="font-semibold text-lg">Profile</h3>

            <p className="mt-2 text-gray-600">Manage your account</p>
          </div>

          <div className="bg-green-50 p-5 rounded-lg">
            <h3 className="font-semibold text-lg">Activity</h3>

            <p className="mt-2 text-gray-600">View recent activity</p>
          </div>

          <div className="bg-purple-50 p-5 rounded-lg">
            <h3 className="font-semibold text-lg">Settings</h3>

            <p className="mt-2 text-gray-600">Configure preferences</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
