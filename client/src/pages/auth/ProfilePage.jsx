// components/auth/ProfilePage.jsx
import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Button,
  Input,
  Badge,
  Card,
  LoadingSpinner,
  Alert,
  IconWrapper,
} from "../../components/common";
import { FaUser, FaEnvelope, FaKey, FaShieldAlt } from "react-icons/fa";

const ProfilePage = () => {
  const { user, changePassword, regenerateApiKey, loading } = useAuth();

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccessMessage("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );
      setSuccessMessage("Password updated successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message || "Failed to update password");
    }
  };

  const handleRegenerateApiKey = async () => {
    try {
      await regenerateApiKey();
      setSuccessMessage("API key regenerated successfully");
    } catch (err) {
      setError(err.message || "Failed to regenerate API key");
    }
  };

  if (!user) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold text-primary-600 mb-6">
        Profile Settings
      </h1>

      {/* User Info Card */}
      <Card className="mb-6 p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-2xl text-primary-600">
            {user.fullName?.charAt(0) || "U"}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user.fullName}</h2>
            <p className="text-neutral-500">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={user.role === "admin" ? "primary" : "neutral"}>
                {user.role}
              </Badge>
              <Badge variant={user.status === "active" ? "success" : "warning"}>
                {user.status}
              </Badge>
              <Badge variant={user.plan === "free" ? "info" : "success"}>
                {user.plan}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div>
            <p className="text-sm text-neutral-500">API Key</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                {apiKeyVisible ? user.apiKey : "••••••••••••••••"}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setApiKeyVisible(!apiKeyVisible)}
              >
                {apiKeyVisible ? "Hide" : "Show"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRegenerateApiKey}
                loading={loading}
              >
                Regenerate
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm text-neutral-500">Account Stats</p>
            <div className="flex gap-4">
              <div>
                <span className="font-bold">{user.totalClicks || 0}</span>
                <span className="text-sm text-neutral-500 ml-1">
                  Total Clicks
                </span>
              </div>
              <div>
                <span className="font-bold">{user.quotaLimit || 0}</span>
                <span className="text-sm text-neutral-500 ml-1">
                  Quota Limit
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert
          variant="success"
          className="mb-4"
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Change Password Card */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FaShieldAlt className="text-primary-500" />
          Change Password
        </h3>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            placeholder="Enter current password"
            required
          />

          <Input
            label="New Password"
            id="newPassword"
            name="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            placeholder="Min 8 characters"
            required
          />

          <Input
            label="Confirm New Password"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            placeholder="Re-enter new password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ProfilePage;
