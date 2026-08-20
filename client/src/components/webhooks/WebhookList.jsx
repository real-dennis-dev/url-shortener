import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWebhookContext } from "./WebhookProvider";
import {
  Button,
  Badge,
  Table,
  Pagination,
  LoadingSpinner,
  EmptyState,
  ErrorState,
  Alert,
  Toast,
  Modal,
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

export default function WebhookList() {
  const navigate = useNavigate();
  const {
    webhooks,
    loading,
    error,
    pagination,
    filters,
    deleteWebhook,
    fetchWebhooks,
    updateFilters,
    changePage,
    clearError,
  } = useWebhookContext();

  const [deleteModal, setDeleteModal] = useState(null);
  const [toast, setToast] = useState(null);

  const handleDelete = async (id) => {
    const success = await deleteWebhook(id);
    if (success) {
      setDeleteModal(null);
      setToast({
        message: "Webhook deleted successfully",
        variant: "success",
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getStatusBadge = (status) => {
    const color = statusColors[status] || "neutral";
    const label = statusLabels[status] || status;
    return <Badge variant={color}>{label}</Badge>;
  };

  const getEventBadges = (events) => {
    return events.slice(0, 3).map((event) => (
      <Badge key={event} variant="info" size="sm" className="mr-1">
        {eventLabels[event] || event}
      </Badge>
    ));
  };

  if (loading && webhooks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && webhooks.length === 0) {
    return (
      <ErrorState
        title="Failed to load webhooks"
        description={error}
        onRetry={fetchWebhooks}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Webhook"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-neutral-600">
            Are you sure you want to delete this webhook? This action cannot be
            undone.
          </p>
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="danger"
              fullWidth
              onClick={() => handleDelete(deleteModal)}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => setDeleteModal(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Webhooks</h1>
          <p className="text-neutral-500 mt-1">
            Manage webhook endpoints for real-time events
          </p>
        </div>
        <Link to="/webhooks/create">
          <Button variant="primary" size="sm">
            + Create Webhook
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">Sort By:</label>
          <select
            className="px-3 py-1.5 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.sortBy}
            onChange={(e) => updateFilters({ sortBy: e.target.value })}
          >
            <option value="createdAt">Created</option>
            <option value="updatedAt">Updated</option>
            <option value="name">Name</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">Order:</label>
          <select
            className="px-3 py-1.5 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filters.sortOrder}
            onChange={(e) => updateFilters({ sortOrder: e.target.value })}
          >
            <option value="DESC">Newest First</option>
            <option value="ASC">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {webhooks.length === 0 && !loading ? (
        <EmptyState
          title="No webhooks configured"
          description="Create your first webhook to start receiving real-time events"
          action={
            <Link to="/webhooks/create">
              <Button variant="primary">Create Webhook</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table
              headers={[
                "URL",
                "Events",
                "Status",
                "Failure Count",
                "Last Triggered",
                "Actions",
              ]}
              data={webhooks}
              renderRow={(webhook) => (
                <tr key={webhook.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/webhooks/${webhook.id}`}
                      className="text-primary-600 hover:text-primary-800 hover:underline truncate max-w-[200px] block"
                      title={webhook.url}
                    >
                      {webhook.url}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {getEventBadges(webhook.events)}
                      {webhook.events.length > 3 && (
                        <Badge variant="neutral" size="sm">
                          +{webhook.events.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(webhook.status)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-medium ${
                        webhook.failure_count > 0
                          ? "text-error"
                          : "text-success"
                      }`}
                    >
                      {webhook.failure_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {webhook.last_triggered_at
                      ? new Date(webhook.last_triggered_at).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <Dropdown
                      trigger={
                        <Button variant="outline" size="sm">
                          Actions
                        </Button>
                      }
                    >
                      <DropdownItem
                        onClick={() => navigate(`/webhooks/${webhook.id}`)}
                      >
                        View Details
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => navigate(`/webhooks/${webhook.id}/edit`)}
                      >
                        Edit
                      </DropdownItem>
                      <DropdownItem
                        onClick={() => setDeleteModal(webhook.id)}
                        className="text-error"
                      >
                        Delete
                      </DropdownItem>
                    </Dropdown>
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
    </div>
  );
}
