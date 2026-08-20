import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useModeration } from "../../hooks/useModeration";
import ModerationLogsViewer from "../../components/moderation/ModerationLogsViewer";
import { Alert, Breadcrumb } from "../../components/common";

const ModerationLogsPage = () => {
  const { urlId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    moderationLogs,
    logsLoading,
    logsPagination,
    fetchModerationLogs,
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
    if (urlId) {
      loadLogs();
    }
  }, [urlId, page]);

  const loadLogs = async () => {
    await fetchModerationLogs(urlId, {
      page,
      limit: 20,
    });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Moderation", href: "/moderation" },
          { label: "Flagged URLs", href: "/moderation/flagged" },
          { label: `Logs: ${urlId?.slice(0, 8)}...` },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Moderation Logs
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          URL ID: {urlId}
        </p>
      </div>

      <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-700">
        <ModerationLogsViewer
          logs={moderationLogs}
          total={logsPagination.total}
          page={logsPagination.page}
          totalPages={logsPagination.totalPages}
          limit={logsPagination.limit}
          onPageChange={handlePageChange}
          isLoading={logsLoading}
        />
      </div>
    </div>
  );
};

export default ModerationLogsPage;
