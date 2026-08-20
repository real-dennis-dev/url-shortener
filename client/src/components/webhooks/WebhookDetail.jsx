import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useWebhookContext } from "./WebhookProvider";
import {
  Button,
  Badge,
  LoadingSpinner,
  ErrorState,
  ProgressBar,
  Alert,
  Table,
  Pagination,
  Modal,
  Toast,
  Dropdown,
  DropdownItem,
} from "../common";

const statusColors = {
  active: "success",
  degraded: "warning",
  inactive: "neutral",
  deactivated: "error",
};

const statusLabels = {
  active: "Active",
  degraded: "Degraded",
  inactive: "Inactive",
  deactivated: "Deactivated",
};

const eventLabels = {
  "url.created": "URL Created",
  "url.updated": "URL Updated",
  "url.deleted": "URL Deleted",
  "url.clicked": "URL Clicked",
  "url.expired": "URL Expired",
  "url.flagged": "URL Flagged",
  "url.blocked": "URL Blocked",
  "user.registered": "User Registered",
  "user.updated": "User Updated",
  "user.deleted": "User Deleted",
  "report.created": "Report Created",
  "report.resolved": "Report Resolved",
  "report.dismissed": "Report Dismissed",
};

export default function WebhookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    selectedWebhook,
    events,
    testResult,
    loading,
    error,
    eventPagination,
    fetchWebhookById,
    fetchWebhookEvents,
    testWebhook,
    deleteWebhook,
    changeEventsPage,
    clearError,
    clearTestResult,
  } = useWebhookContext();

  const [testModal, setTestModal] = useState(false);
  const [testEvent, setTestEvent] = useState("url.created");
  const [testData, setTestData] = useState("{}");
  const [deleteModal, setDeleteModal] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (id) {
      fetchWebhookById(id);
      fetchWebhookEvents(id);
    }
  }, [id, fetchWebhookById, fetchWebhookEvents]);

  const handleTest = async () => {
    let customData = null;
    try {
      if (testData.trim()) {
        customData = JSON.parse(testData);
      }
    } catch (err) {
      setToast({
        message: "Invalid JSON in custom data",
        variant: "error",
      });
      return;
    }

    await testWebhook(id, {
      event: testEvent,
      customData,
    });
    setTestModal(false);
    setToast({
      message: "Test completed successfully",
      variant: "success",
    });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    const success = await deleteWebhook(id);
    if (success) {
      navigate("/webhooks/list");
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

  const getEventBadges = (events) => {
    return events.map((event) => (
      <Badge key={event} variant="info" size="sm" className="mr-1">
        {eventLabels[event] || event}
      </Badge>
    ));
  };

  if (loading && !selectedWebhook) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !selectedWebhook) {
    return (
      <ErrorState
        title="Webhook not found"
        description={error || "The requested webhook could not be found"}
        onRetry={() => fetchWebhookById(id)}
      />
    );
  }

  const webhook = selectedWebhook;

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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Webhook"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-600">
            Are you sure you want to delete this webhook? This action cannot be
            undone.
          </p>
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="danger" fullWidth onClick={handleDelete}>
              Delete
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setDeleteModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Test Modal */}
      <Modal
        isOpen={testModal}
        onClose={() => {
          setTestModal(false);
          clearTestResult();
        }}
        title="Test Webhook"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Event
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={testEvent}
              onChange={(e) => setTestEvent(e.target.value)}
            >
              {AVAILABLE_EVENTS.map((event) => (
                <option key={event.value} value={event.value}>
                  {event.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Custom Data (JSON)
            </label>
            <Textarea
              rows={6}
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              placeholder='{"key": "value"}'
            />
            <p className="mt-1 text-sm text-neutral-500">
              Optional custom data to include in the test payload
            </p>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="primary"
              fullWidth
              onClick={handleTest}
              disabled={loading}
              loading={loading}
            >
              Send Test
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setTestModal(false);
                clearTestResult();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/webhooks/list">
          <Button variant="ghost" size="sm">
            ← Back to Webhooks
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">Webhook Details</h1>
      </div>

      {/* Status Banner */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            {getStatusBadge(webhook.status)}
            <span className="text-sm text-neutral-500">
              Created: {new Date(webhook.created_at).toLocaleString()}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestModal(true)}
            >
              🧪 Test
            </Button>
            <Link to={`/webhooks/${id}/edit`}>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <Alert
          variant={testResult.success ? "success" : "error"}
          title={testResult.success ? "Test Successful" : "Test Failed"}
          onClose={clearTestResult}
        >
          <div className="space-y-2">
            <p>
              Status Code: <strong>{testResult.statusCode}</strong>
            </p>
            <p>
              Response Time: <strong>{testResult.responseTime}ms</strong>
            </p>
            {testResult.response && (
              <details>
                <summary className="cursor-pointer text-primary-600">
                  View Response
                </summary>
                <pre className="mt-2 p-3 bg-neutral-100 rounded overflow-auto max-h-40 text-sm">
                  {JSON.stringify(testResult.response, null, 2)}
                </pre>
              </details>
            )}
            {testResult.error && (
              <p className="text-error">Error: {testResult.error}</p>
            )}
          </div>
        </Alert>
      )}

      {/* Webhook Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Configuration</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-neutral-500">URL:</span>
              <a
                href={webhook.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-primary-600 hover:underline block truncate"
              >
                {webhook.url}
              </a>
            </div>
            <div>
              <span className="text-neutral-500">Events:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {getEventBadges(webhook.events)}
              </div>
            </div>
            <div>
              <span className="text-neutral-500">Active:</span>
              <span className="ml-2 font-medium">
                {webhook.is_active ? "Yes" : "No"}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">Secret:</span>
              <span className="ml-2 font-mono">
                {webhook.secret ? "••••••••" : "Not set"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Health</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-neutral-500">Status:</span>
              <span className="ml-2">{getStatusBadge(webhook.status)}</span>
            </div>
            <div>
              <span className="text-neutral-500">Failure Count:</span>
              <span
                className={`ml-2 font-medium ${
                  webhook.failure_count > 0 ? "text-error" : "text-success"
                }`}
              >
                {webhook.failure_count}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">Last Triggered:</span>
              <span className="ml-2">
                {webhook.last_triggered_at
                  ? new Date(webhook.last_triggered_at).toLocaleString()
                  : "Never"}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">Updated:</span>
              <span className="ml-2">
                {new Date(webhook.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Events History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Event History</h3>
        </div>
        <div className="p-4">
          {events.length === 0 ? (
            <p className="text-center text-neutral-500 py-8">
              No events recorded yet
            </p>
          ) : (
            <>
              <Table
                headers={["Event", "Status", "Timestamp"]}
                data={events}
                renderRow={(event) => (
                  <tr key={event.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Badge variant="info" size="sm">
                        {event.event}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          event.metadata?.status === "delivered"
                            ? "success"
                            : "error"
                        }
                        size="sm"
                      >
                        {event.metadata?.status || "Unknown"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-500">
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                  </tr>
                )}
              />
              {eventPagination.totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                  <Pagination
                    currentPage={eventPagination.page}
                    totalPages={eventPagination.totalPages}
                    onPageChange={changeEventsPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Available events for test modal
const AVAILABLE_EVENTS = [
  { value: "url.created", label: "URL Created" },
  { value: "url.updated", label: "URL Updated" },
  { value: "url.deleted", label: "URL Deleted" },
  { value: "url.clicked", label: "URL Clicked" },
  { value: "url.expired", label: "URL Expired" },
  { value: "url.flagged", label: "URL Flagged" },
  { value: "url.blocked", label: "URL Blocked" },
];
