import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useModeration } from "../../hooks/useModeration";
import {
  Alert,
  Breadcrumb,
  Badge,
  Pagination,
  Button,
  LoadingSpinner,
} from "../../components/common";

const STATUS_LABELS = {
  flagged: "Flagged",
  blocked: "Blocked",
};

const STATUS_COLORS = {
  flagged: "warning",
  blocked: "error",
};

const FlaggedUrlsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    flaggedUrls,
    flaggedLoading,
    flaggedPagination,
    fetchFlaggedUrls,
    isModerator,
  } = useModeration();

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
    loadFlaggedUrls();
  }, [page]);

  const loadFlaggedUrls = async () => {
    await fetchFlaggedUrls({
      page,
      limit: 20,
    });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    loadFlaggedUrls();
  };

  const handleViewLogs = (urlId) => {
    navigate(`/moderation/logs/${urlId}`);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Moderation", href: "/moderation" },
          { label: "Flagged URLs" },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Flagged & Blocked URLs
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Review URLs that have been flagged or blocked
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      {flaggedLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : flaggedUrls.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          <p className="text-lg font-medium">No flagged URLs</p>
          <p className="text-sm">All URLs are currently in good standing</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
            <table className="w-full">
              <thead className="bg-neutral-200/50 dark:bg-neutral-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Short Code
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Clicks
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {flaggedUrls.map((url) => (
                  <tr
                    key={url.id}
                    className="hover:bg-neutral-200/30 dark:hover:bg-neutral-800/30"
                  >
                    <td className="px-4 py-3 font-mono text-sm text-neutral-900 dark:text-neutral-100">
                      {url.short_code}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                      {url.title || "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_COLORS[url.status]} size="sm">
                        {STATUS_LABELS[url.status] || url.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {url.user_email || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                      {url.total_clicks || 0}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleViewLogs(url.id)}
                      >
                        View Logs
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {flaggedPagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                Showing {flaggedUrls.length} of {flaggedPagination.total} URLs
              </div>
              <Pagination
                currentPage={flaggedPagination.page}
                totalPages={flaggedPagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FlaggedUrlsPage;
