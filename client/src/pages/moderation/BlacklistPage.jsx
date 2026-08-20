import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useModeration } from "../../hooks/useModeration";
import BlacklistManager from "../../components/moderation/BlacklistManager";
import { Alert, Breadcrumb } from "../../components/common";

const BlacklistPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    blacklist,
    blacklistLoading,
    blacklistPagination,
    blacklistAdding,
    blacklistRemoveLoading,
    fetchBlacklist,
    addToBlacklist,
    removeFromBlacklist,
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
    loadBlacklist();
  }, [page]);

  const loadBlacklist = async () => {
    await fetchBlacklist({
      page,
      limit: 20,
    });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Moderation", href: "/moderation" },
          { label: "Blacklist" },
        ]}
      />

      <BlacklistManager
        blacklist={blacklist}
        total={blacklistPagination.total}
        page={blacklistPagination.page}
        totalPages={blacklistPagination.totalPages}
        limit={blacklistPagination.limit}
        onPageChange={handlePageChange}
        isLoading={blacklistLoading}
        onAdd={addToBlacklist}
        onRemove={removeFromBlacklist}
        adding={blacklistAdding}
        removing={blacklistRemoveLoading}
      />
    </div>
  );
};

export default BlacklistPage;
