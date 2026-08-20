import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useModeration } from "../../hooks/useModeration";
import ReportsTable from "../../components/moderation/ReportsTable";
import { Alert, Breadcrumb, Button, Select } from "../../components/common";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const REASON_OPTIONS = [
  { value: "", label: "All Reasons" },
  { value: "spam", label: "Spam" },
  { value: "malware", label: "Malware" },
  { value: "phishing", label: "Phishing" },
  { value: "harassment", label: "Harassment" },
  { value: "adult_content", label: "Adult Content" },
  { value: "illegal_activity", label: "Illegal Activity" },
  { value: "copyright", label: "Copyright" },
  { value: "other", label: "Other" },
];

const ReportsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    reports,
    reportsLoading,
    reportsPagination,
    fetchReports,
    isModerator,
  } = useModeration();

  const [filters, setFilters] = useState({
    status: "",
    reason: "",
  });
  const [page, setPage] = useState(1);

  // Check if user has moderator permissions
  if (!authLoading && !isModerator) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <Alert variant="error" title="Access Denied">
          You need moderator permissions to access this page.
        </Alert>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-primary-500 hover:underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  useEffect(() => {
    loadReports();
  }, [page, filters]);

  const loadReports = async () => {
    await fetchReports({
      page,
      limit: 20,
      ...(filters.status && { status: filters.status }),
      ...(filters.reason && { reason: filters.reason }),
    });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const handleRefresh = () => {
    loadReports();
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Moderation", href: "/moderation" },
          { label: "Reports" },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Reports
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Manage and review abuse reports
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
        <div className="flex-1 min-w-[150px]">
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Reason
          </label>
          <select
            value={filters.reason}
            onChange={(e) => handleFilterChange("reason", e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <ReportsTable
        reports={reports}
        total={reportsPagination.total}
        page={reportsPagination.page}
        totalPages={reportsPagination.totalPages}
        limit={reportsPagination.limit}
        onPageChange={handlePageChange}
        isLoading={reportsLoading}
        onRefresh={handleRefresh}
      />
    </div>
  );
};

export default ReportsPage;
