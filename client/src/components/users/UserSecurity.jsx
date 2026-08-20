import { useState } from "react";
import { useUserContext } from "./UserProvider";
import { Button, Input, Alert, Toast, Modal } from "../common";

export default function UserSecurity() {
  const {
    regenerateApiKey,
    changePassword,
    deleteAccount,
    loading,
    error,
    clearError,
  } = useUserContext();

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [apiKey, setApiKey] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [toast, setToast] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    confirm: false,
    password: "",
  });
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setToast({
        message: "New passwords do not match",
        variant: "error",
      });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    setSaving(true);
    try {
      await changePassword(passwordData);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setToast({
        message: "Password changed successfully!",
        variant: "success",
      });
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setToast({
        message: err.message || "Failed to change password",
        variant: "error",
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateApiKey = async () => {
    try {
      const result = await regenerateApiKey();
      if (result) {
        setApiKey(result.apiKey);
        setShowApiKey(true);
        setToast({
          message: "API key regenerated successfully!",
          variant: "success",
        });
        setTimeout(() => setToast(null), 5000);
      }
    } catch (err) {
      setToast({
        message: "Failed to regenerate API key",
        variant: "error",
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount(deleteConfirm);
      setShowDeleteModal(false);
      setToast({
        message: "Account deleted successfully",
        variant: "success",
      });
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      setToast({
        message: err.message || "Failed to delete account",
        variant: "error",
      });
      setTimeout(() => setToast(null), 5000);
    }
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setToast({
        message: "API key copied to clipboard!",
        variant: "success",
      });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <Toast variant={toast.variant} onClose={() => setToast(null)}>
            {toast.message}
          </Toast>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          Security Settings
        </h1>
        <p className="text-neutral-500 mt-1">
          Manage your password and API key
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Error" onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            type="password"
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) =>
              handlePasswordChange("currentPassword", e.target.value)
            }
            placeholder="Enter your current password"
            required
            fullWidth
          />

          <Input
            type="password"
            label="New Password"
            value={passwordData.newPassword}
            onChange={(e) =>
              handlePasswordChange("newPassword", e.target.value)
            }
            placeholder="Enter new password (min 8 chars)"
            required
            fullWidth
            helper="Must contain at least 8 characters, including uppercase, lowercase, number, and special character"
          />

          <Input
            type="password"
            label="Confirm New Password"
            value={passwordData.confirmNewPassword}
            onChange={(e) =>
              handlePasswordChange("confirmNewPassword", e.target.value)
            }
            placeholder="Confirm your new password"
            required
            fullWidth
          />

          <Button
            type="submit"
            variant="primary"
            loading={saving}
            disabled={saving}
          >
            Update Password
          </Button>
        </form>
      </div>

      {/* API Key */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">API Key</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Your API key is used to authenticate requests to the API. Keep it
          secure and never share it.
        </p>

        {showApiKey && apiKey ? (
          <div className="bg-neutral-100 p-4 rounded-md mb-4">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono break-all">{apiKey}</code>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowApiKey(false)}
                >
                  Hide
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-400 mb-4">
            Your API key is hidden. Generate a new one to view it.
          </p>
        )}

        <Button
          variant="primary"
          onClick={handleRegenerateApiKey}
          loading={loading}
        >
          {apiKey ? "Regenerate API Key" : "Generate API Key"}
        </Button>
        <p className="text-xs text-neutral-400 mt-2">
          Regenerating will invalidate your previous API key
        </p>
      </div>

      {/* Delete Account */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-error mb-4">
          Delete Account
        </h2>
        <p className="text-sm text-neutral-500 mb-4">
          Once you delete your account, there is no going back. This action is
          permanent and will delete all your data including URLs, clicks, and
          settings.
        </p>

        <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </Button>
      </div>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
        size="md"
      >
        <div className="space-y-4">
          <Alert variant="error" title="Warning">
            This action is irreversible. All your data will be permanently
            deleted.
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="confirmDelete"
                className="h-4 w-4 text-error-600 focus:ring-error-500 border-neutral-300 rounded"
                checked={deleteConfirm.confirm}
                onChange={(e) =>
                  setDeleteConfirm((prev) => ({
                    ...prev,
                    confirm: e.target.checked,
                  }))
                }
              />
              <label
                htmlFor="confirmDelete"
                className="ml-2 text-sm text-neutral-700"
              >
                I understand that this action is permanent and cannot be undone
              </label>
            </div>

            <Input
              type="password"
              label="Enter your password to confirm"
              value={deleteConfirm.password}
              onChange={(e) =>
                setDeleteConfirm((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              placeholder="Enter your current password"
              required
              fullWidth
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="danger"
              fullWidth
              disabled={!deleteConfirm.confirm || !deleteConfirm.password}
              onClick={handleDeleteAccount}
              loading={loading}
            >
              Permanently Delete Account
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirm({ confirm: false, password: "" });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
