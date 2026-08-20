import { useState } from "react";
import { useNotificationContext } from "./NotificationProvider";
import {
  Button,
  Badge,
  Table,
  Pagination,
  LoadingSpinner,
  EmptyState,
  ErrorState,
  Alert,
  Dropdown,
  DropdownItem,
} from "../common";
import {
  BellIcon,
  CheckIcon,
  XIcon,
  TrashIcon,
  CheckCircleIcon,
} from "lucide-react";

const typeColors = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
};

const typeIcons = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

export default function NotificationList() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    filters,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateFilters,
    changePage,
    clearFilters,
    clearError,
  } = useNotificationContext();

  const [selectedNotification, setSelectedNotification] = useState(null);

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this notification?")) {
      await deleteNotification(id);
    }
  };

  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value });
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="text-neutral-500 mt-1">
            {unreadCount > 0 ? (
              <Badge variant="error" size="sm">
                {unreadCount} unread
              </Badge>
            ) : (
              "All caught up!"
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
          <Dropdown
            trigger={
              <Button variant="outline" size="sm">
                Filters
              </Button>
            }
          >
            <DropdownItem
              onClick={() => handleFilterChange("isRead", undefined)}
            >
              All
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange("isRead", false)}>
              Unread
            </DropdownItem>
            <DropdownItem onClick={() => handleFilterChange("isRead", true)}>
              Read
            </DropdownItem>
            <DropdownItem onClick={clearFilters}>Clear filters</DropdownItem>
          </Dropdown>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error" title="Error" onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Notifications */}
      {notifications.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="You're all caught up! No notifications to display."
          icon={<BellIcon className="w-16 h-16 text-neutral-400" />}
        />
      ) : (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow p-4 transition-all ${
                  !notification.is_read ? "border-l-4 border-primary-500" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="text-2xl mt-1">
                    {typeIcons[notification.type] || "📢"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-neutral-900">
                            {notification.title}
                          </h4>
                          <Badge
                            variant={typeColors[notification.type] || "info"}
                            size="sm"
                          >
                            {notification.type}
                          </Badge>
                          {!notification.is_read && (
                            <Badge variant="error" size="sm">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-neutral-600 text-sm mt-1 whitespace-pre-wrap">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
                          <span>
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                          {notification.channel && (
                            <span>via {notification.channel}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          title="Delete"
                          className="text-error hover:text-error"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
