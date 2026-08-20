import { useEffect } from "react";
import { useSystem } from "../../hooks/useSystem";
import {
  LoadingSpinner,
  ErrorState,
  Input,
  Button,
  Table,
  Pagination,
  Badge,
  DatePicker,
} from "../common";

export default function SystemLogs() {
  const {
    logs,
    logsPagination,
    logsFilters,
    loading,
    error,
    fetchLogs,
    updateLogsFilters,
    changeLogsPage,
  } = useSystem();

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (key, value) => {
    updateLogsFilters({ [key]: value });
  };

  const handleSearch = () => {
    fetchLogs();
  };

  const handleClearFilters = () => {
    updateLogsFilters({
      operation: "",
      userId: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load logs"
        description={error}
        onRetry={fetchLogs}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Logs</h1>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            label="Operation"
            value={logsFilters.operation}
            onChange={(e) => handleFilterChange("operation", e.target.value)}
            placeholder="Filter by operation"
          />
          <Input
            label="User ID"
            type="number"
            value={logsFilters.userId}
            onChange={(e) => handleFilterChange("userId", e.target.value)}
            placeholder="Filter by user ID"
          />
          <DatePicker
            label="Date From"
            value={logsFilters.dateFrom}
            onChange={(value) => handleFilterChange("dateFrom", value)}
          />
          <DatePicker
            label="Date To"
            value={logsFilters.dateTo}
            onChange={(value) => handleFilterChange("dateTo", value)}
          />
          <div className="flex items-end gap-2">
            <Button variant="primary" size="sm" onClick={handleSearch}>
              Search
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table
          headers={[
            "ID",
            "User",
            "Endpoint",
            "Method",
            "Status",
            "Response Time",
            "Created",
          ]}
          data={logs}
          renderRow={(log) => (
            <tr key={log.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3 text-sm font-mono">
                {log.id?.substring(0, 8)}...
              </td>
              <td className="px-4 py-3">
                {log.userId || (
                  <span className="text-neutral-400">Anonymous</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm">{log.endpoint || "N/A"}</td>
              <td className="px-4 py-3">
                <Badge variant="neutral" size="sm">
                  {log.method || "N/A"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={
                    log.statusCode >= 200 && log.statusCode < 300
                      ? "success"
                      : log.statusCode >= 400 && log.statusCode < 500
                      ? "warning"
                      : log.statusCode >= 500
                      ? "error"
                      : "neutral"
                  }
                  size="sm"
                >
                  {log.statusCode || "N/A"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {log.responseTime ? `${log.responseTime}ms` : "N/A"}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-500">
                {log.createdAt
                  ? new Date(log.createdAt).toLocaleString()
                  : "N/A"}
              </td>
            </tr>
          )}
        />

        {logs.length === 0 && !loading && (
          <div className="text-center py-8 text-neutral-500">
            No logs found matching the filters
          </div>
        )}
      </div>

      {/* Pagination */}
      {logsPagination.totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-neutral-500">
            Showing {logs.length} of {logsPagination.total} entries
          </span>
          <Pagination
            currentPage={logsPagination.page}
            totalPages={logsPagination.totalPages}
            onPageChange={changeLogsPage}
          />
        </div>
      )}
    </div>
  );
}
