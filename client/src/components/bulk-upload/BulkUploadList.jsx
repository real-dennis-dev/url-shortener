import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useBulkUploadContext } from "./BulkUploadProvider";
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
  FileUpload,
  ProgressBar,
  Alert,
  Toast,
  Modal,
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

export default function BulkUploadList() {
  const {
    uploads,
    loading,
    error,
    uploadProgress,
    pagination,
    filters,
    uploadFile,
    fetchUploads,
    cancelUpload,
    downloadTemplate,
    updateFilters,
    changePage,
    clearError,
  } = useBulkUploadContext();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadFile(selectedFile);
    if (result) {
      setShowUploadModal(false);
      setSelectedFile(null);
      setToast({
        message: "File uploaded successfully! Processing has started.",
        variant: "success",
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm("Are you sure you want to cancel this upload?")) {
      await cancelUpload(id);
      setToast({
        message: "Upload cancelled successfully",
        variant: "warning",
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDownloadTemplate = async (format) => {
    await downloadTemplate(format);
  };

  const handleSearch = (value) => {
    // Update filters with search term
    updateFilters({ search: value });
  };

  const handleStatusFilter = (status) => {
    updateFilters({ status: status === filters.status ? "" : status });
  };

  const getStatusBadge = (status) => {
    const color = statusColors[status] || "neutral";
    const label = statusLabels[status] || status;
    return <Badge variant={color}>{label}</Badge>;
  };

  if (loading && uploads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && uploads.length === 0) {
    return (
      <ErrorState
        title="Failed to load uploads"
        description={error}
        onRetry={fetchUploads}
      />
    );
  }

  return (
    <div>
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast variant={toast.variant} onClose={() => setToast(null)}>
            {toast.message}
          </Toast>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Bulk Uploads</h1>
          <p className="text-neutral-500 mt-1">
            Upload and manage multiple URLs at once
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadTemplate("csv")}
          >
            Download CSV Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownloadTemplate("excel")}
          >
            Download Excel Template
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUploadModal(true)}
          >
            + Upload File
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar
            placeholder="Search uploads..."
            onSearch={handleSearch}
            fullWidth
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["pending", "processing", "completed", "failed", "cancelled"].map(
            (status) => (
              <Button
                key={status}
                variant={filters.status === status ? "primary" : "outline"}
                size="sm"
                onClick={() => handleStatusFilter(status)}
              >
                {statusLabels[status]}
              </Button>
            )
          )}
          {filters.status && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => updateFilters({ status: "" })}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {uploads.length === 0 && !loading ? (
        <EmptyState
          title="No uploads found"
          description="Upload your first CSV or Excel file to get started"
          action={
            <Button variant="primary" onClick={() => setShowUploadModal(true)}>
              Upload File
            </Button>
          }
        />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table
              headers={[
                "Filename",
                "Status",
                "Total URLs",
                "Successful",
                "Failed",
                "Progress",
                "Created",
                "Actions",
              ]}
              data={uploads}
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
                  <td className="px-4 py-3">{getStatusBadge(upload.status)}</td>
                  <td className="px-4 py-3 text-center">{upload.totalUrls}</td>
                  <td className="px-4 py-3 text-center text-success">
                    {upload.successful || 0}
                  </td>
                  <td className="px-4 py-3 text-center text-error">
                    {upload.failed || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-32">
                      <ProgressBar
                        value={upload.progress || 0}
                        max={100}
                        size="sm"
                        showLabel={false}
                      />
                      <span className="text-xs text-neutral-500 mt-1">
                        {upload.progress || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {new Date(upload.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/bulk-upload/uploads/${upload.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                      {(upload.status === "pending" ||
                        upload.status === "processing") && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancel(upload.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
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

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
        }}
        title="Upload URLs File"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-neutral-600 text-sm">
            Upload a CSV or Excel file containing URLs to shorten.
            <br />
            <Link
              to="#"
              className="text-primary-600 hover:underline"
              onClick={(e) => {
                e.preventDefault();
                handleDownloadTemplate("csv");
              }}
            >
              Download template
            </Link>{" "}
            to see the required format.
          </p>

          <FileUpload
            accept=".csv,.xlsx,.xls"
            onFileSelect={handleFileSelect}
            label="Choose a CSV or Excel file"
            multiple={false}
            maxSize={10}
          />

          {selectedFile && (
            <div className="text-sm text-neutral-600">
              Selected: <span className="font-medium">{selectedFile.name}</span>{" "}
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <ProgressBar value={uploadProgress} max={100} />
              <p className="text-sm text-neutral-500 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {error && (
            <Alert variant="error" title="Upload Failed">
              {error}
            </Alert>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="primary"
              fullWidth
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              loading={loading}
            >
              Upload
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
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
