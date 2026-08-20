import { useState, useEffect } from "react";
import { useNotificationContext } from "./NotificationProvider";
import {
  Button,
  Switch,
  Alert,
  LoadingSpinner,
  ErrorState,
  Input,
} from "../common";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function NotificationPreferences() {
  const {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
    clearError,
  } = useNotificationContext();

  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const handleChange = (path, value) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const keys = path.split(".");
      let current = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;

    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    const success = await updatePreferences(formData);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load preferences"
        description={error}
        onRetry={fetchPreferences}
      />
    );
  }

  if (!formData) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">
        Notification Preferences
      </h1>

      {saveSuccess && (
        <Alert variant="success" onClose={() => setSaveSuccess(false)}>
          Preferences saved successfully!
        </Alert>
      )}

      {error && (
        <Alert variant="error" title="Error" onClose={clearError}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Channels */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Notification Channels</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-neutral-500">
                  Receive notifications via email
                </p>
              </div>
              <Switch
                checked={formData.email}
                onChange={(e) => handleChange("email", e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-neutral-500">
                  Receive push notifications in browser
                </p>
              </div>
              <Switch
                checked={formData.push}
                onChange={(e) => handleChange("push", e.target.checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Webhook Notifications</p>
                <p className="text-sm text-neutral-500">
                  Receive notifications via webhook
                </p>
              </div>
              <Switch
                checked={formData.webhook}
                onChange={(e) => handleChange("webhook", e.target.checked)}
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Notification Categories
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {formData.categories &&
              Object.entries(formData.categories).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="capitalize">{key.replace("_", " ")}</span>
                  <Switch
                    checked={value}
                    onChange={(e) =>
                      handleChange(`categories.${key}`, e.target.checked)
                    }
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Digest Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Digest Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Digest</p>
                <p className="text-sm text-neutral-500">
                  Receive summary digests of notifications
                </p>
              </div>
              <Switch
                checked={formData.digest?.enabled}
                onChange={(e) =>
                  handleChange("digest.enabled", e.target.checked)
                }
              />
            </div>

            {formData.digest?.enabled && (
              <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Frequency
                  </label>
                  <select
                    value={formData.digest?.frequency || "weekly"}
                    onChange={(e) =>
                      handleChange("digest.frequency", e.target.value)
                    }
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Day</label>
                  <select
                    value={formData.digest?.day || "monday"}
                    onChange={(e) => handleChange("digest.day", e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <Input
                    type="time"
                    value={formData.digest?.time || "09:00"}
                    onChange={(e) =>
                      handleChange("digest.time", e.target.value)
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Quiet Hours</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Quiet Hours</p>
                <p className="text-sm text-neutral-500">
                  Silence notifications during specified hours
                </p>
              </div>
              <Switch
                checked={formData.quietHours?.enabled}
                onChange={(e) =>
                  handleChange("quietHours.enabled", e.target.checked)
                }
              />
            </div>

            {formData.quietHours?.enabled && (
              <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Start Time
                  </label>
                  <Input
                    type="time"
                    value={formData.quietHours?.start || "22:00"}
                    onChange={(e) =>
                      handleChange("quietHours.start", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    End Time
                  </label>
                  <Input
                    type="time"
                    value={formData.quietHours?.end || "07:00"}
                    onChange={(e) =>
                      handleChange("quietHours.end", e.target.value)
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg" loading={saving}>
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
