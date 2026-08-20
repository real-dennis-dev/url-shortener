import { useState, useEffect } from "react";
import { useUserContext } from "./UserProvider";
import { Button, Switch, LoadingSpinner, Toast } from "../common";

export default function UserPreferences() {
  const { preferences, loading, error, updatePreferences, fetchPreferences } =
    useUserContext();

  const [formData, setFormData] = useState({
    theme: "system",
    notifications: true,
    language: "en",
    timezone: "UTC",
    emailNotifications: true,
    pushNotifications: true,
    analyticsOptOut: false,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updatePreferences({ preferences: formData });
      setToast({
        message: "Preferences updated successfully!",
        variant: "success",
      });
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setToast({
        message: "Failed to update preferences",
        variant: "error",
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !preferences) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast variant={toast.variant} onClose={() => setToast(null)}>
            {toast.message}
          </Toast>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Preferences</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Theme
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.theme}
              onChange={(e) => handleChange("theme", e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Language
            </label>
            <select
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.language}
              onChange={(e) => handleChange("language", e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Timezone
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.timezone}
              onChange={(e) => handleChange("timezone", e.target.value)}
              placeholder="America/New_York"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Notification Preferences</h3>

            <div className="space-y-3">
              <Switch
                checked={formData.notifications}
                onChange={(checked) => handleChange("notifications", checked)}
                label="Enable notifications"
              />

              <Switch
                checked={formData.emailNotifications}
                onChange={(checked) =>
                  handleChange("emailNotifications", checked)
                }
                label="Email notifications"
              />

              <Switch
                checked={formData.pushNotifications}
                onChange={(checked) =>
                  handleChange("pushNotifications", checked)
                }
                label="Push notifications"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Privacy</h3>

            <Switch
              checked={formData.analyticsOptOut}
              onChange={(checked) => handleChange("analyticsOptOut", checked)}
              label="Opt out of analytics tracking"
            />
          </div>

          <div className="pt-4 border-t">
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={saving}
            >
              Save Preferences
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
