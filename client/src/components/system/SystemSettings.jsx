import { useState, useEffect } from "react";
import { useSystem } from "../../hooks/useSystem";
import {
  LoadingSpinner,
  ErrorState,
  Button,
  Input,
  Switch,
  Alert,
  Toast,
} from "../common";

export default function SystemSettings() {
  const {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    toggleMaintenance,
    maintenanceMode,
    maintenanceMessage,
  } = useSystem();

  const [formData, setFormData] = useState({});
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      // Flatten settings for form
      const flattened = {};
      Object.keys(settings).forEach((key) => {
        if (
          settings[key] &&
          typeof settings[key] === "object" &&
          "value" in settings[key]
        ) {
          flattened[key] = settings[key].value;
        }
      });
      setFormData(flattened);
    }
  }, [settings]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const success = await updateSettings(formData);
      if (success) {
        setToast({
          message: "Settings updated successfully",
          variant: "success",
        });
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleMaintenanceToggle = async (enabled) => {
    const message = enabled ? "System maintenance scheduled." : "";
    await toggleMaintenance(enabled, message);
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load settings"
        description={error}
        onRetry={fetchSettings}
      />
    );
  }

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast variant={toast.variant} onClose={() => setToast(null)}>
            {toast.message}
          </Toast>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Maintenance Mode</span>
            <Switch
              checked={maintenanceMode}
              onChange={handleMaintenanceToggle}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={isSaving}
            disabled={isSaving}
          >
            Save Settings
          </Button>
        </div>
      </div>

      {maintenanceMode && (
        <Alert
          variant="warning"
          title="Maintenance Mode Active"
          className="mb-6"
        >
          {maintenanceMessage || "System is currently in maintenance mode."}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">URL Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Max URL Length"
              type="number"
              value={formData.max_url_length || ""}
              onChange={(e) =>
                handleChange("max_url_length", parseInt(e.target.value))
              }
              helper="Maximum length for URLs (100-10000)"
            />
            <Input
              label="Short Code Length"
              type="number"
              value={formData.short_code_length || ""}
              onChange={(e) =>
                handleChange("short_code_length", parseInt(e.target.value))
              }
              helper="Default length for short codes (3-10)"
            />
            <Input
              label="Max Short Code Length"
              type="number"
              value={formData.max_short_code_length || ""}
              onChange={(e) =>
                handleChange("max_short_code_length", parseInt(e.target.value))
              }
              helper="Maximum length for short codes (5-30)"
            />
            <Input
              label="Bulk Upload Max Rows"
              type="number"
              value={formData.bulk_upload_max_rows || ""}
              onChange={(e) =>
                handleChange("bulk_upload_max_rows", parseInt(e.target.value))
              }
              helper="Maximum rows per bulk upload (100-100000)"
            />
          </div>
        </div>

        {/* Rate Limits */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Rate Limits</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Anonymous Users"
              type="number"
              value={formData.rate_limits?.anonymous || ""}
              onChange={(e) =>
                handleChange("rate_limits", {
                  ...formData.rate_limits,
                  anonymous: parseInt(e.target.value),
                })
              }
              helper="Requests per minute"
            />
            <Input
              label="Authenticated Users"
              type="number"
              value={formData.rate_limits?.authenticated || ""}
              onChange={(e) =>
                handleChange("rate_limits", {
                  ...formData.rate_limits,
                  authenticated: parseInt(e.target.value),
                })
              }
              helper="Requests per minute"
            />
            <Input
              label="Premium Users"
              type="number"
              value={formData.rate_limits?.premium || ""}
              onChange={(e) =>
                handleChange("rate_limits", {
                  ...formData.rate_limits,
                  premium: parseInt(e.target.value),
                })
              }
              helper="Requests per minute"
            />
          </div>
          <div className="mt-4">
            <Input
              label="API Rate Limit"
              type="number"
              value={formData.api_rate_limit || ""}
              onChange={(e) =>
                handleChange("api_rate_limit", parseInt(e.target.value))
              }
              helper="API requests per minute (10-10000)"
            />
          </div>
        </div>

        {/* Allowed Domains */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Allowed Domains</h3>
          <Input
            label="Allowed Domains (comma-separated)"
            value={formData.allowed_domains?.join(", ") || ""}
            onChange={(e) =>
              handleChange(
                "allowed_domains",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            helper="Use '*' for all domains"
          />
        </div>

        {/* QR Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">QR Code Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Default QR Size"
              type="number"
              value={formData.qr_settings?.default_size || ""}
              onChange={(e) =>
                handleChange("qr_settings", {
                  ...formData.qr_settings,
                  default_size: parseInt(e.target.value),
                })
              }
              helper="Size in pixels (100-1000)"
            />
            <Input
              label="Allowed Formats"
              value={formData.qr_settings?.allowed_formats?.join(", ") || ""}
              onChange={(e) =>
                handleChange("qr_settings", {
                  ...formData.qr_settings,
                  allowed_formats: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              helper="Comma-separated (png, svg, jpg)"
            />
          </div>
        </div>

        {/* Cache Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cache Settings</h3>
          <Input
            label="Click Cache Duration"
            type="number"
            value={formData.click_cache_duration || ""}
            onChange={(e) =>
              handleChange("click_cache_duration", parseInt(e.target.value))
            }
            helper="Duration in seconds (60-86400)"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => fetchSettings()}>
            Reset
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={isSaving}
            disabled={isSaving}
          >
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
