import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useWebhookContext } from "./WebhookProvider";
import {
  Button,
  Input,
  Textarea,
  Switch,
  Alert,
  LoadingSpinner,
  Breadcrumb,
} from "../common";

const AVAILABLE_EVENTS = [
  { value: "url.created", label: "URL Created" },
  { value: "url.updated", label: "URL Updated" },
  { value: "url.deleted", label: "URL Deleted" },
  { value: "url.clicked", label: "URL Clicked" },
  { value: "url.expired", label: "URL Expired" },
  { value: "url.flagged", label: "URL Flagged" },
  { value: "url.blocked", label: "URL Blocked" },
  { value: "user.registered", label: "User Registered" },
  { value: "user.updated", label: "User Updated" },
  { value: "user.deleted", label: "User Deleted" },
  { value: "report.created", label: "Report Created" },
  { value: "report.resolved", label: "Report Resolved" },
  { value: "report.dismissed", label: "Report Dismissed" },
];

export default function WebhookCreate({ isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    selectedWebhook,
    loading,
    error,
    createWebhook,
    updateWebhook,
    fetchWebhookById,
    clearError,
  } = useWebhookContext();

  const [formData, setFormData] = useState({
    url: "",
    events: [],
    secret: "",
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEdit && id) {
      fetchWebhookById(id);
    }
  }, [isEdit, id, fetchWebhookById]);

  useEffect(() => {
    if (isEdit && selectedWebhook) {
      setFormData({
        url: selectedWebhook.url || "",
        events: selectedWebhook.events || [],
        secret: selectedWebhook.secret || "",
        isActive:
          selectedWebhook.is_active !== undefined
            ? selectedWebhook.is_active
            : true,
      });
    }
  }, [isEdit, selectedWebhook]);

  const validate = () => {
    const errors = {};

    if (!formData.url) {
      errors.url = "URL is required";
    } else if (!formData.url.startsWith("https://")) {
      errors.url = "URL must use HTTPS";
    } else if (formData.url.length > 2048) {
      errors.url = "URL must be less than 2048 characters";
    }

    if (formData.events.length === 0) {
      errors.events = "At least one event is required";
    }

    if (
      formData.secret &&
      (formData.secret.length < 16 || formData.secret.length > 64)
    ) {
      errors.secret = "Secret must be between 16 and 64 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data = {
      url: formData.url,
      events: formData.events,
      isActive: formData.isActive,
    };

    if (formData.secret) {
      data.secret = formData.secret;
    }

    let result;
    if (isEdit && id) {
      result = await updateWebhook(id, data);
    } else {
      result = await createWebhook(data);
    }

    if (result) {
      navigate("/webhooks/list");
    }
  };

  const handleEventToggle = (eventValue) => {
    setFormData((prev) => {
      const events = prev.events.includes(eventValue)
        ? prev.events.filter((e) => e !== eventValue)
        : [...prev.events, eventValue];
      return { ...prev, events };
    });
  };

  const breadcrumbItems = [
    { label: "Webhooks", href: "/webhooks/list" },
    { label: isEdit ? "Edit Webhook" : "Create Webhook" },
  ];

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          {isEdit ? "Edit Webhook" : "Create Webhook"}
        </h1>
      </div>

      {error && (
        <Alert variant="error" title="Error" onClose={clearError}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* URL */}
        <Input
          label="Endpoint URL"
          type="url"
          placeholder="https://example.com/webhook"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          error={formErrors.url}
          helper="The HTTPS URL where webhook events will be sent"
          required
        />

        {/* Events */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Events <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-neutral-300 rounded-lg p-4">
            {AVAILABLE_EVENTS.map((event) => (
              <label
                key={event.value}
                className="flex items-center space-x-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={formData.events.includes(event.value)}
                  onChange={() => handleEventToggle(event.value)}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
                <span>{event.label}</span>
              </label>
            ))}
          </div>
          {formErrors.events && (
            <p className="mt-1 text-sm text-error">{formErrors.events}</p>
          )}
          <p className="mt-1 text-sm text-neutral-500">
            Select at least one event to trigger this webhook
          </p>
        </div>

        {/* Secret */}
        <Input
          label="Secret (Optional)"
          type="text"
          placeholder="Enter a secret for signature validation"
          value={formData.secret}
          onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
          error={formErrors.secret}
          helper="16-64 characters. Used to sign webhook payloads for verification"
        />

        {/* Active Status */}
        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <p className="font-medium text-neutral-700">Active Status</p>
            <p className="text-sm text-neutral-500">
              {formData.isActive
                ? "Webhook is active and will receive events"
                : "Webhook is inactive"}
            </p>
          </div>
          <Switch
            checked={formData.isActive}
            onChange={(checked) =>
              setFormData({ ...formData, isActive: checked })
            }
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            loading={loading}
            fullWidth
          >
            {isEdit ? "Update Webhook" : "Create Webhook"}
          </Button>
          <Link to="/webhooks/list" className="flex-1">
            <Button variant="outline" fullWidth>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
