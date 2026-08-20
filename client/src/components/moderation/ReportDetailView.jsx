import { useState } from "react";
import {
  Badge,
  Button,
  Textarea,
  Alert,
  LoadingSpinner,
  Breadcrumb,
} from "../common";

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

const ReportDetailView = ({
  report,
  isLoading = false,
  onUpdate,
  onBack,
  updating = false,
  error = null,
}) => {
  const [status, setStatus] = useState(report?.status || "pending");
  const [resolution, setResolution] = useState(report?.resolution || "");
  const [validationError, setValidationError] = useState("");

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-neutral-500 dark:text-neutral-400">
        <p className="text-lg font-medium">Report not found</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          Go Back
        </Button>
      </div>
    );
  }

  const handleUpdate = () => {
    if (status === "resolved" && !resolution.trim()) {
      setValidationError("Resolution details are required when resolving");
      return;
    }
    setValidationError("");
    onUpdate({
      status,
      resolution: resolution.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Moderation", href: "/moderation" },
          { label: "Reports", href: "/moderation/reports" },
          { label: `Report #${report.id?.slice(0, 8)}` },
        ]}
      />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Report Details
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            ID: {report.id}
          </p>
        </div>
        <Badge variant={STATUS_COLORS[report.status]} size="lg">
          {STATUS_LABELS[report.status] || report.status}
        </Badge>
      </div>

      {/* Report Info */}
      <div className="grid gap-4 rounded-lg border border-neutral-200 p-6 dark:border-neutral-700">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Reason
            </p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {REASON_LABELS[report.reason] || report.reason}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Reported At
            </p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {new Date(report.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {report.description && (
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Description
            </p>
            <p className="text-neutral-900 dark:text-neutral-100">
              {report.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Reporter
            </p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {report.reporter_email ||
                report.reporter_email_full ||
                "Anonymous"}
            </p>
          </div>
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Short Code
            </p>
            <p className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
              {report.short_code || "N/A"}
            </p>
          </div>
        </div>

        {report.resolution && (
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Resolution
            </p>
            <p className="text-neutral-900 dark:text-neutral-100">
              {report.resolution}
            </p>
          </div>
        )}

        {report.resolved_at && (
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Resolved At
            </p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {new Date(report.resolved_at).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Update Form */}
      <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-700">
        <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Update Report
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          {status === "resolved" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Resolution Details <span className="text-error">*</span>
              </label>
              <Textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how this report was resolved..."
                rows={3}
                error={validationError}
              />
            </div>
          )}

          {error && (
            <Alert variant="error" title="Update Failed">
              {error}
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={updating}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleUpdate}
              loading={updating}
              disabled={updating}
            >
              Update Report
            </Button>
          </div>
        </div>
      </div>

      {/* Moderation Logs */}
      {report.moderation_logs && report.moderation_logs.length > 0 && (
        <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-700">
          <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Moderation History
          </h3>
          <div className="space-y-3">
            {report.moderation_logs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg bg-neutral-200/50 p-4 dark:bg-neutral-800/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {log.action}
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {log.reason}
                </p>
                {log.admin_email && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    By: {log.admin_email}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetailView;
