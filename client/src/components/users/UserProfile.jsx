import { useState, useEffect } from "react";
import { useUserContext } from "./UserProvider";
import {
  Button,
  Input,
  Textarea,
  LoadingSpinner,
  ErrorState,
  Alert,
  Toast,
} from "../common";

export default function UserProfile() {
  const { profile, loading, error, updateProfile, fetchProfile, clearError } =
    useUserContext();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    avatarUrl: "",
    preferences: {
      theme: "system",
      notifications: true,
      language: "en",
      timezone: "UTC",
    },
  });

  const [toast, setToast] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        email: profile.email || "",
        avatarUrl: profile.avatarUrl || "",
        preferences: profile.preferences || {
          theme: "system",
          notifications: true,
          language: "en",
          timezone: "UTC",
        },
      });
    }
  }, [profile]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfile(formData);
      setIsEditing(false);
      setToast({
        message: "Profile updated successfully!",
        variant: "success",
      });
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setToast({
        message: "Failed to update profile",
        variant: "error",
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <ErrorState
        title="Failed to load profile"
        description={error}
        onRetry={fetchProfile}
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

      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>
            <p className="text-neutral-500 mt-1">
              Manage your personal information
            </p>
          </div>
          {!isEditing && (
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="error" title="Error" onClose={clearError}>
            {error}
          </Alert>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Enter your full name"
                required
                fullWidth
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter your email"
                required
                fullWidth
                disabled
                helper="Email cannot be changed. Contact support if you need to update it."
              />

              <Input
                label="Avatar URL"
                value={formData.avatarUrl}
                onChange={(e) => handleChange("avatarUrl", e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                fullWidth
              />

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Theme
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.preferences.theme}
                      onChange={(e) =>
                        handlePreferenceChange("theme", e.target.value)
                      }
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Language
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.preferences.language}
                      onChange={(e) =>
                        handlePreferenceChange("language", e.target.value)
                      }
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
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Timezone
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.preferences.timezone}
                      onChange={(e) =>
                        handlePreferenceChange("timezone", e.target.value)
                      }
                      placeholder="America/New_York"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifications"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      checked={formData.preferences.notifications}
                      onChange={(e) =>
                        handlePreferenceChange(
                          "notifications",
                          e.target.checked
                        )
                      }
                    />
                    <label
                      htmlFor="notifications"
                      className="ml-2 text-sm text-neutral-700"
                    >
                      Enable notifications
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  disabled={saving}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      fullName: profile?.fullName || "",
                      email: profile?.email || "",
                      avatarUrl: profile?.avatarUrl || "",
                      preferences: profile?.preferences || {
                        theme: "system",
                        notifications: true,
                        language: "en",
                        timezone: "UTC",
                      },
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-600">
                      {profile?.fullName?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold">{profile?.fullName}</h2>
                  <p className="text-neutral-500">{profile?.email}</p>
                  <p className="text-sm text-neutral-400">
                    Joined: {new Date(profile?.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-neutral-500">Role</p>
                  <p className="font-medium capitalize">
                    {profile?.role || "User"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Plan</p>
                  <p className="font-medium capitalize">
                    {profile?.plan || "Free"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Status</p>
                  <p className="font-medium capitalize">
                    {profile?.status || "Active"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Last Login</p>
                  <p className="font-medium">
                    {profile?.lastLogin
                      ? new Date(profile.lastLogin).toLocaleString()
                      : "Never"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Quota Usage</h3>
                <div className="bg-neutral-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-primary-500 h-full transition-all"
                    style={{
                      width: `${profile?.quota?.percentage || 0}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm text-neutral-500 mt-1">
                  <span>{profile?.quota?.used || 0} used</span>
                  <span>{profile?.quota?.remaining || 0} remaining</span>
                  <span>{profile?.quota?.total || 0} total</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
