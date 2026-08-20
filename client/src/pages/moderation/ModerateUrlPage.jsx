import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useModeration } from "../../hooks/useModeration";
import ModerateUrlForm from "../../components/moderation/ModerateUrlForm";
import { Alert, Breadcrumb, LoadingSpinner } from "../../components/common";

const ModerateUrlPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    moderateUrl,
    moderating,
    moderationResult,
    moderationError,
    clearModerationResult,
    clearModerationError,
    isModerator,
  } = useModeration();

  const [urlId, setUrlId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  const handleSubmit = async (data) => {
    clearModerationResult();
    clearModerationError();
    setSuccessMessage("");

    const result = await moderateUrl(urlId, data);

    if (result.success) {
      setSuccessMessage(
        `URL moderated successfully with action: ${data.action}`
      );
      setShowForm(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    clearModerationResult();
    clearModerationError();
    setUrlId("");
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Moderation", href: "/moderation" },
          { label: "Moderate URL" },
        ]}
      />

      <h1 className="mb-6 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
        Moderate URL
      </h1>

      {!showForm ? (
        <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-700">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Enter URL ID to moderate
          </h2>
          <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
            Enter the UUID of the URL you want to moderate.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              value={urlId}
              onChange={(e) => setUrlId(e.target.value)}
              placeholder="Enter URL ID (UUID)"
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <button
              onClick={() => setShowForm(true)}
              disabled={!urlId.trim()}
              className="rounded-lg bg-primary-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <>
          {successMessage && (
            <Alert variant="success" title="Success" className="mb-6">
              {successMessage}
            </Alert>
          )}

          {moderationResult && (
            <Alert variant="info" title="Moderation Complete" className="mb-6">
              <pre className="mt-2 overflow-auto rounded bg-neutral-100 p-2 text-xs dark:bg-neutral-800">
                {JSON.stringify(moderationResult, null, 2)}
              </pre>
            </Alert>
          )}

          <div className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-700">
            <ModerateUrlForm
              urlId={urlId}
              onSubmit={handleSubmit}
              isLoading={moderating}
              error={moderationError}
              onCancel={handleCancel}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ModerateUrlPage;
