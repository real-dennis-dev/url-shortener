import { Badge, Pagination, LoadingSpinner } from "../common";

const ACTION_COLORS = {
  block: "error",
  flag: "warning",
  warn: "warning",
  delete: "error",
  review: "info",
};

const ACTION_LABELS = {
  block: "Blocked",
  flag: "Flagged",
  warn: "Warned",
  delete: "Deleted",
  review: "Review Requested",
};

const ModerationLogsViewer = ({
  logs = [],
  total = 0,
  page = 1,
  totalPages = 1,
  limit = 20,
  onPageChange,
  isLoading = false,
  title = "Moderation History",
}) => {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {total} entries
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 p-8 text-center dark:border-neutral-700">
          <p className="text-neutral-500 dark:text-neutral-400">
            No moderation logs found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-700"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={ACTION_COLORS[log.action] || "neutral"}
                    size="sm"
                  >
                    {ACTION_LABELS[log.action] || log.action}
                  </Badge>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {log.reason}
                  </span>
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>

              {log.notes && (
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  {log.notes}
                </p>
              )}

              {(log.admin_email || log.admin_name) && (
                <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
                  By: {log.admin_name || log.admin_email || "System"}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700">
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing {logs.length} of {total} entries
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

export default ModerationLogsViewer;
