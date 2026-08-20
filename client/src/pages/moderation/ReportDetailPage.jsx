import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useModeration } from "../../hooks/useModeration";
import ReportDetailView from "../../components/moderation/ReportDetailView";
import { Alert, LoadingSpinner } from "../../components/common";

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    selectedReport,
    reportDetailLoading,
    fetchReportById,
    updateReport,
    reportUpdating,
    reportUpdateError,
    isModerator,
  } = useModeration();

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
    if (id) {
      fetchReportById(id);
    }
  }, [id]);

  const handleUpdate = async (data) => {
    const result = await updateReport(id, data);
    if (result.success) {
      // Refresh the report details
      await fetchReportById(id);
    }
  };

  const handleBack = () => {
    navigate("/moderation/reports");
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <ReportDetailView
        report={selectedReport}
        isLoading={reportDetailLoading}
        onUpdate={handleUpdate}
        onBack={handleBack}
        updating={reportUpdating}
        error={reportUpdateError}
      />
    </div>
  );
};

export default ReportDetailPage;
