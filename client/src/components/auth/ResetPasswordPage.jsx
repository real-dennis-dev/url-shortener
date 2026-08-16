// components/auth/ResetPasswordPage.jsx
import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button, Input, Alert } from "../common";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword, loading } = useAuth();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await resetPassword(
        token,
        formData.newPassword,
        formData.confirmPassword
      );
      setSubmitted(true);
      setTimeout(() => navigate("/auth/login"), 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    }
  };

  if (submitted) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-success mb-2">Password Reset</h1>
        <p className="text-neutral-600 dark:text-neutral-300 mb-6">
          Your password has been reset successfully. Redirecting to login...
        </p>
        <Link
          to="/auth/login"
          className="text-primary-500 hover:text-primary-600"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-primary-600">Reset Password</h1>
        <p className="text-neutral-500 mt-2">Enter your new password</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          id="newPassword"
          name="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="Min 8 characters"
          required
          helper="Must be at least 8 characters long"
        />

        <Input
          label="Confirm Password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter new password"
          required
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          Reset Password
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/auth/login"
          className="text-sm text-primary-500 hover:text-primary-600 transition-colors"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
