import { useEffect, useState } from "react";
import { useUserContext } from "./UserProvider";
import {
  Button,
  Input,
  Badge,
  Table,
  Pagination,
  SearchBar,
  LoadingSpinner,
  EmptyState,
  ErrorState,
  Modal,
  Alert,
  Toast,
} from "../common";

const roleColors = {
  user: "neutral",
  admin: "error",
  moderator: "warning",
  support: "info",
};

const planColors = {
  free: "neutral",
  pro: "primary",
  business: "warning",
  enterprise: "info",
};

const statusColors = {
  active: "success",
  suspended: "warning",
  banned: "error",
  pending_verification: "info",
};

export default function UserManagement() {
  const {
    users,
    loading,
    error,
    pagination,
    fetchAllUsers,
    updateUserPlan,
    changePage,
    clearError,
  } = useUserContext();

  const [filters, setFilters] = useState({
    role: "",
    plan: "",
    status: "",
    search: "",
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState("");
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAllUsers(filters);
  }, [pagination.page, filters]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    if (field !== "search") {
      changePage(1);
    }
  };

  const handleSearch = (value) => {
    handleFilterChange("search", value);
  };

  const handlePlanUpdate = async () => {
    if (!selectedUser || !newPlan) return;

    setSaving(true);
    try {
      await updateUserPlan(newPlan);
      setShowPlanModal(false);
      setSelectedUser(null);
      setNewPlan("");
      setToast({
        message: "User plan updated successfully!",
        variant: "success",
      });
      setTimeout(() => setToast(null), 5000);
      fetchAllUsers(filters);
    } catch (err) {
      setToast({
        message: err.message || "Failed to update plan",
        variant: "error",
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const openPlanModal = (user) => {
    setSelectedUser(user);
    setNewPlan(user.plan);
    setShowPlanModal(true);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <ErrorState
        title="Failed to load users"
        description={error}
        onRetry={() => fetchAllUsers(filters)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast variant={toast.variant} onClose={() => setToast(null)}>
            {toast.message}
          </Toast>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">User Management</h1>
        <p className="text-neutral-500 mt-1">Manage all users in the system</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Search
            </label>
            <SearchBar
              placeholder="Search by email or name..."
              onSearch={handleSearch}
              fullWidth
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Role
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="support">Support</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Plan
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.plan}
              onChange={(e) => handleFilterChange("plan", e.target.value)}
            >
              <option value="">All Plans</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
              <option value="pending_verification">Pending</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setFilters({ role: "", plan: "", status: "", search: "" });
                changePage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <EmptyState
          title="No users found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table
              headers={[
                "User",
                "Email",
                "Role",
                "Plan",
                "Status",
                "Quota",
                "Actions",
              ]}
              data={users}
              renderRow={(user) => (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary-600">
                            {user.fullName?.charAt(0) ||
                              user.email?.charAt(0) ||
                              "U"}
                          </span>
                        </div>
                      )}
                      <span className="font-medium">
                        {user.fullName || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={roleColors[user.role] || "neutral"}>
                      {user.role || "user"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={planColors[user.plan] || "neutral"}>
                      {user.plan || "free"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusColors[user.status] || "neutral"}>
                      {user.status || "active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <span className="font-medium">
                        {user.quota?.used || 0}
                      </span>
                      <span className="text-neutral-400"> / </span>
                      <span>{user.quota?.total || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPlanModal(user)}
                    >
                      Change Plan
                    </Button>
                  </td>
                </tr>
              )}
            />
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={changePage}
              />
            </div>
          )}
        </>
      )}

      {/* Change Plan Modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setSelectedUser(null);
          setNewPlan("");
        }}
        title="Change User Plan"
        size="md"
      >
        <div className="space-y-4">
          {selectedUser && (
            <div>
              <p className="text-sm text-neutral-600">
                Updating plan for{" "}
                <span className="font-medium">
                  {selectedUser.fullName || selectedUser.email}
                </span>
              </p>
              <p className="text-sm text-neutral-500">
                Current plan:{" "}
                <span className="font-medium capitalize">
                  {selectedUser.plan}
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              New Plan
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="primary"
              fullWidth
              onClick={handlePlanUpdate}
              loading={saving}
              disabled={saving}
            >
              Update Plan
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowPlanModal(false);
                setSelectedUser(null);
                setNewPlan("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
