import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useBulkUploadContext } from "./BulkUploadProvider";
import { Button, LoadingSpinner, ErrorState, Badge, Table } from "../common";

const statusColors = {
  pending: "warning",
  processing: "info",
  completed: "success",
  failed: "error",
  cancelled: "neutral",
};

const statusLabels = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export default function BulkUploadStats() {
  const { statistics, loading, error, fetchStatistics } =
    useBulkUploadContext();

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load statistics"
        description={error}
        onRetry={fetchStatistics}
      />
    );
  }

  if (!statistics) {
    return null;
  }

  const { summary, recent } = statistics;

  const summaryCards = [
    { label: "Total Uploads", value: summary.total_uploads, color: "primary" },
    { label: "Total URLs", value: summary.total_urls, color: "primary" },
    { label: "Successful", value: summary.total_successful, color: "success" },
    { label: "Failed", value: summary.total_failed, color: "error" },
    { label: "Completed", value: summary.completed, color: "success" },
    { label: "Processing", value: summary.processing, color: "info" },
    { label: "Pending", value: summary.pending, color: "warning" },
    { label: "Cancelled", value: summary.cancelled, color: "neutral" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Upload Statistics
          </h1>
          <p className="text-neutral-500 mt-1">
            Overview of all your bulk uploads
          </p>
        </div>
        <Link to="/bulk-upload/uploads">
          <Button variant="outline" size="sm">
            View All Uploads
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg shadow p-4 text-center"
          >
            <p className="text-sm text-neutral-500">{card.label}</p>
            <p className={`text-2xl font-bold text-${card.color}-600`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Uploads */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Recent Uploads</h3>
        </div>
        <div className="p-4">
          {recent && recent.length > 0 ? (
            <Table
              headers={["Filename", "Status", "Total URLs", "Created"]}
              data={recent}
              renderRow={(upload) => (
                <tr key={upload.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/bulk-upload/uploads/${upload.id}`}
                      className="text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      {upload.filename}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusColors[upload.status] || "neutral"}>
                      {statusLabels[upload.status] || upload.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">{upload.total_urls}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {new Date(upload.created_at).toLocaleString()}
                  </td>
                </tr>
              )}
            />
          ) : (
            <p className="text-center text-neutral-500 py-8">
              No recent uploads found
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
