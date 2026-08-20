import { useEffect, useState } from "react";
import { useUserContext } from "./UserProvider";
import {
  Button,
  LoadingSpinner,
  ErrorState,
  Pagination,
  EmptyState,
  Table,
  DatePicker,
} from "../common";

export default function UserActivity() {
  const {
    activity,
    loading,
    error,
    pagination,
    fetchActivity,
    changePage,
    clearError,
  } = useUserContext();

  const [filters, setFilters] = useState({
    activityType: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchActivity(filters);
  }, [pagination.page]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    changePage(1);
    fetchActivity({ ...filters, page: 1 });
  };

  const handleClearFilters = () => {
    setFilters({
      activityType: "",
      dateFrom: "",
      dateTo: "",
    });
    changePage(1);
    fetchActivity({ page: 1 });
  };

  if (loading && activity.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && activity.length === 0) {
    return (
      <ErrorState
        title="Failed to load activity"
        description={error}
        onRetry={() => fetchActivity(filters)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Activity Log</h1>
        <p className="text-neutral-500 mt-1">
          View your recent account activity
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Activity Type
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filters.activityType}
              onChange={(e) =>
                handleFilterChange("activityType", e.target.value)
              }
            >
              <option value="">All Types</option>
              <option value="url_created">URL Created</option>
              <option value="url_updated">URL Updated</option>
              <option value="url_deleted">URL Deleted</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="settings_updated">Settings Updated</option>
            </select>
          </div>

          <div>
            <DatePicker
              label="Date From"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              type="date"
            />
          </div>

          <div>
            <DatePicker
              label="Date To"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              type="date"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button variant="primary" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      {activity.length === 0 ? (
        <EmptyState
          title="No activity found"
          description="Your activity log will appear here"
        />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table
              headers={["Activity", "Description", "Date"]}
              data={activity}
              renderRow={(item) => (
                <tr key={item.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {item.activityType?.replace(/_/g, " ") || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{item.description}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {new Date(item.created_at).toLocaleString()}
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
    </div>
  );
}
