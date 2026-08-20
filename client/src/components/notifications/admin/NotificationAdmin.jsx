import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { useNotificationAdmin } from "../../../hooks/useNotificationAdmin";
import { Button, Alert, LoadingSpinner } from "../../common";

export default function NotificationAdmin() {
  const { isAdmin, loading, error } = useNotificationAdmin();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Alert variant="error" title="Access Denied">
        You do not have permission to access this page.
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Notification Admin
          </h1>
          <p className="text-neutral-500 mt-1">
            Manage notifications and templates
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/notifications/send">
            <Button variant="primary" size="sm">
              Send Notification
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="error" title="Error" onClose={() => {}}>
          {error}
        </Alert>
      )}

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
