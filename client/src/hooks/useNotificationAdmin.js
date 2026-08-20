import { useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationService from "../services/notification.service";

/**
 * Admin hook for notification management
 */
export function useNotificationAdmin() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.isAdmin;

  const [emailTemplates, setEmailTemplates] = useState([]);
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  /**
   * Send notification
   */
  const sendNotification = useCallback(
    async (data) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.createNotification(data);
        return response;
      } catch (err) {
        setError(err.message || "Failed to send notification");
        console.error("Send notification error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin]
  );

  /**
   * Send bulk notifications
   */
  const sendBulkNotifications = useCallback(
    async (data) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.sendBulkNotifications(data);
        return response;
      } catch (err) {
        setError(err.message || "Failed to send bulk notifications");
        console.error("Send bulk notifications error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin]
  );

  /**
   * Send email
   */
  const sendEmail = useCallback(
    async (data) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.sendEmail(data);
        return response;
      } catch (err) {
        setError(err.message || "Failed to send email");
        console.error("Send email error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin]
  );

  /**
   * Send template email
   */
  const sendTemplateEmail = useCallback(
    async (data) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.sendTemplateEmail(data);
        return response;
      } catch (err) {
        setError(err.message || "Failed to send template email");
        console.error("Send template email error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin]
  );

  /**
   * Send bulk emails
   */
  const sendBulkEmails = useCallback(
    async (data) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.sendBulkEmails(data);
        return response;
      } catch (err) {
        setError(err.message || "Failed to send bulk emails");
        console.error("Send bulk emails error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin]
  );

  /**
   * Fetch email templates
   */
  const fetchEmailTemplates = useCallback(
    async (params = {}) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.getEmailTemplates({
          ...params,
          page: params.page || pagination.page,
          limit: params.limit || pagination.limit,
        });
        setEmailTemplates(response.templates || []);
        setPagination({
          page: response.page || pagination.page,
          limit: response.limit || pagination.limit,
          total: response.total || 0,
          totalPages: response.totalPages || 0,
        });
        return response;
      } catch (err) {
        setError(err.message || "Failed to fetch email templates");
        console.error("Fetch email templates error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin, pagination.page, pagination.limit]
  );

  /**
   * Create email template
   */
  const createEmailTemplate = useCallback(
    async (data) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.createEmailTemplate(data);
        setEmailTemplates((prev) => [...prev, response]);
        return response;
      } catch (err) {
        setError(err.message || "Failed to create email template");
        console.error("Create email template error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin]
  );

  /**
   * Update email template
   */
  const updateEmailTemplate = useCallback(
    async (name, data) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.updateEmailTemplate(
          name,
          data
        );
        setEmailTemplates((prev) =>
          prev.map((template) => (template.name === name ? response : template))
        );
        return response;
      } catch (err) {
        setError(err.message || "Failed to update email template");
        console.error("Update email template error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin]
  );

  /**
   * Delete email template
   */
  const deleteEmailTemplate = useCallback(
    async (name) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        await NotificationService.deleteEmailTemplate(name);
        setEmailTemplates((prev) => prev.filter((t) => t.name !== name));
        return true;
      } catch (err) {
        setError(err.message || "Failed to delete email template");
        console.error("Delete email template error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin]
  );

  /**
   * Fetch notification templates
   */
  const fetchNotificationTemplates = useCallback(
    async (params = {}) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.getNotificationTemplates({
          ...params,
          page: params.page || pagination.page,
          limit: params.limit || pagination.limit,
        });
        setNotificationTemplates(response.templates || []);
        return response;
      } catch (err) {
        setError(err.message || "Failed to fetch notification templates");
        console.error("Fetch notification templates error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin, pagination.page, pagination.limit]
  );

  /**
   * Create notification template
   */
  const createNotificationTemplate = useCallback(
    async (data) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.createNotificationTemplate(
          data
        );
        setNotificationTemplates((prev) => [...prev, response]);
        return response;
      } catch (err) {
        setError(err.message || "Failed to create notification template");
        console.error("Create notification template error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin]
  );

  /**
   * Update notification template
   */
  const updateNotificationTemplate = useCallback(
    async (name, data) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.updateNotificationTemplate(
          name,
          data
        );
        setNotificationTemplates((prev) =>
          prev.map((template) => (template.name === name ? response : template))
        );
        return response;
      } catch (err) {
        setError(err.message || "Failed to update notification template");
        console.error("Update notification template error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin]
  );

  /**
   * Delete notification template
   */
  const deleteNotificationTemplate = useCallback(
    async (name) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        await NotificationService.deleteNotificationTemplate(name);
        setNotificationTemplates((prev) => prev.filter((t) => t.name !== name));
        return true;
      } catch (err) {
        setError(err.message || "Failed to delete notification template");
        console.error("Delete notification template error:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin]
  );

  /**
   * Preview template
   */
  const previewTemplate = useCallback(
    async (data) => {
      if (!isAuthenticated || !isAdmin) {
        setError("Admin access required");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await NotificationService.previewTemplate(data);
        setTemplatePreview(response.preview);
        return response.preview;
      } catch (err) {
        setError(err.message || "Failed to preview template");
        console.error("Preview template error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    emailTemplates,
    notificationTemplates,
    templatePreview,
    loading,
    error,
    pagination,
    isAdmin,

    // Actions
    sendNotification,
    sendBulkNotifications,
    sendEmail,
    sendTemplateEmail,
    sendBulkEmails,
    fetchEmailTemplates,
    createEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    fetchNotificationTemplates,
    createNotificationTemplate,
    updateNotificationTemplate,
    deleteNotificationTemplate,
    previewTemplate,
    clearError,
  };
}

export default useNotificationAdmin;
