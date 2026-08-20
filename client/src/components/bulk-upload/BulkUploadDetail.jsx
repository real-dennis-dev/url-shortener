import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useBulkUploadContext } from "./BulkUploadProvider";
import {
  Button,
  Badge,
  LoadingSpinner,
  ErrorState,
  ProgressBar,
  Alert,
  Table,
} from "../common";

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

export default function BulkUploadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    selectedUpload,
    loading,
    error,
    fetchUploadById,
    cancelUpload,
    startPolling,
    stopPolling,
    pollingId,
  } = useBulkUploadContext();

  useEffect(() => {
    if (id) {
      fetchUploadById(id);
    }
    return () => {
      stopPolling();
    };
  }, [id, fetchUploadById, stopPolling]);

  // Start polling if upload is pending or processing
  useEffect(() => {
    if (
      selectedUpload &&
      ["pending", "processing"].includes(selectedUpload.status)
    ) {
      if (pollingId !== id) {
        startPolling(id);
      }
    } else {
      if (pollingId === id) {
        stopPolling();
      }
    }
  }, [selectedUpload, id, startPolling, stopPolling, pollingId]);

  const handleCancel = async () => {
    if (window.confirm("Are you sure you want to cancel this upload?")) {
      await cancelUpload(id);
      // Refresh details
      fetchUploadById(id);
    }
  };

  const getStatusBadge = (status) => {
    const color = statusColors[status] || "neutral";
    const label = statusLabels[status] || status;
    return (
      <Badge variant={color} size="lg">
        {label}
      </Badge>
    );
  };

  if (loading && !selectedUpload) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !selectedUpload) {
    return (
      <ErrorState
        title="Upload not found"
        description={error || "The requested upload could not be found"}
        onRetry={() => fetchUploadById(id)}
      />
    );
  }

  const { data: upload } = selectedUpload;

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/bulk-upload/uploads">
          <Button variant="ghost" size="sm">
            ← Back to Uploads
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Upload Details</h1>
      </div>

      {/* Status Banner */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            {getStatusBadge(upload.status)}
            <span className="text-sm text-neutral-500">
              {new Date(upload.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex gap-2">
            {["pending", "processing"].includes(upload.status) && (
              <Button variant="danger" size="sm" onClick={handleCancel}>
                Cancel Upload
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-neutral-500">Total URLs</p>
            <p className="text-2xl font-bold">{upload.totalUrls}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Successful</p>
            <p className="text-2xl font-bold text-success">
              {upload.successful || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Failed</p>
            <p className="text-2xl font-bold text-error">
              {upload.failed || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500">Progress</p>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ProgressBar value={upload.progress || 0} max={100} size="sm" />
              </div>
              <span className="text-sm font-medium">
                {upload.progress || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {upload.errors && upload.errors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-error mb-4">Errors</h3>
          <div className="max-h-60 overflow-y-auto">
            <Table
              headers={["Row", "URL", "Errors"]}
              data={upload.errors}
              renderRow={(error, index) => (
                <tr key={index} className="hover:bg-neutral-50">
                  <td className="px-4 py-2 text-sm">{error.row}</td>
                  <td className="px-4 py-2 text-sm">{error.url || "N/A"}</td>
                  <td className="px-4 py-2 text-sm text-error">
                    <ul className="list-disc list-inside">
                      {error.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      )}

      {/* File Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">File Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-neutral-500">Filename:</span>
            <span className="ml-2 font-medium">{upload.filename}</span>
          </div>
          <div>
            <span className="text-neutral-500">Status:</span>
            <span className="ml-2">
              {statusLabels[upload.status] || upload.status}
            </span>
          </div>
          <div>
            <span className="text-neutral-500">Created:</span>
            <span className="ml-2">
              {new Date(upload.createdAt).toLocaleString()}
            </span>
          </div>
          {upload.completedAt && (
            <div>
              <span className="text-neutral-500">Completed:</span>
              <span className="ml-2">
                {new Date(upload.completedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
