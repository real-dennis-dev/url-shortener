import { useNavigate } from "react-router-dom";
import { Badge, Table, Button, Pagination, SearchBar } from "../common";

const STATUS_COLORS = {
  pending: "warning",
  investigating: "info",
  resolved: "success",
  dismissed: "neutral",
};

const STATUS_LABELS = {
  pending: "Pending",
  investigating: "Investigating",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const REASON_LABELS = {
  spam: "Spam",
  malware: "Malware",
  phishing: "Phishing",
  harassment: "Harassment",
  adult_content: "Adult Content",
  illegal_activity: "Illegal Activity",
  copyright: "Copyright",
  other: "Other",
};

const ReportsTable = ({
  reports = [],
  total = 0,
  page = 1,
  totalPages = 1,
  limit = 20,
  onPageChange,
  isLoading = false,
  onRefresh,
}) => {
  const navigate = useNavigate();

  const headers = [
    { key: "id", label: "ID" },
    { key: "url", label: "URL" },
    { key: "reason", label: "Reason" },
    { key: "status", label: "Status" },
    { key: "reportedAt", label: "Reported At" },
    { key: "actions", label: "Actions" },
  ];

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString();
  };

  const handleViewReport = (id) => {
    navigate(`/moderation/reports/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-400 border-t-transparent"></div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-neutral-500 dark:text-neutral-400">
        <p className="text-lg font-medium">No reports found</p>
        <p className="text-sm">Try adjusting your filters</p>
        {onRefresh && (
          <Button variant="outline" className="mt-4" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table
        headers={headers}
        variant="striped"
        className="min-w-full"
        renderRow={(report) => (
          <tr
            key={report.id}
            className="cursor-pointer hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
            onClick={() => handleViewReport(report.id)}
          >
            <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
              {report.id?.slice(0, 8)}...
            </td>
            <td className="px-4 py-3 text-sm">
              <div className="max-w-xs truncate text-neutral-900 dark:text-neutral-100">
                {report.short_code || "N/A"}
              </div>
            </td>
            <td className="px-4 py-3 text-sm">
              <Badge variant="neutral" size="sm">
                {REASON_LABELS[report.reason] || report.reason}
              </Badge>
            </td>
            <td className="px-4 py-3 text-sm">
              <Badge variant={STATUS_COLORS[report.status]} size="sm">
                {STATUS_LABELS[report.status] || report.status}
              </Badge>
            </td>
            <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
              {formatDate(report.created_at)}
            </td>
            <td className="px-4 py-3 text-sm">
              <Button
                size="sm"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewReport(report.id);
                }}
              >
                View
              </Button>
            </td>
          </tr>
        )}
        data={reports}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing {reports.length} of {total} reports
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default ReportsTable;
