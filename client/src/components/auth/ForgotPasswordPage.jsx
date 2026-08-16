// components/auth/ForgotPasswordPage.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button, Input, Alert } from "../common";

const ForgotPasswordPage = () => {
  const { requestPasswordReset, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }

    try {
      await requestPasswordReset(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    }
  };

  if (submitted) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 text-center">
        <div className="text-4xl mb-4">📧</div>
        <h1 className="text-2xl font-bold text-primary-600 mb-2">
          Check Your Email
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 mb-6">
          We've sent a password reset link to <strong>{email}</strong>
        </p>
        <Link
          to="/auth/login"
          className="text-primary-500 hover:text-primary-600"
        >
          Return to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-primary-600">Forgot Password</h1>
        <p className="text-neutral-500 mt-2">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          autoComplete="email"
          required
          error={error}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          Send Reset Link
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

export default ForgotPasswordPage;
