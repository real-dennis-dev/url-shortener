// components/auth/VerifyEmailPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LoadingSpinner, Alert } from "../../components/common";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const { verifyEmail, loading } = useAuth();

  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error'
  const [error, setError] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        await verifyEmail(token);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setError(err.message || "Email verification failed");
      }
    };

    verify();
  }, [token, verifyEmail]);

  if (status === "verifying") {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 text-center">
        <LoadingSpinner size="lg" />
        <h1 className="text-xl font-bold mt-4">Verifying Email</h1>
        <p className="text-neutral-500">Please wait...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-success mb-2">
          Email Verified!
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300 mb-6">
          Your email has been verified successfully.
        </p>
        <Link
          to="/auth/login"
          className="text-primary-500 hover:text-primary-600 font-medium"
        >
          Proceed to login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8 text-center">
      <div className="text-4xl mb-4">❌</div>
      <h1 className="text-2xl font-bold text-error mb-2">
        Verification Failed
      </h1>
      <Alert variant="error" className="mb-4">
        {error || "The verification link is invalid or has expired."}
      </Alert>
      <p className="text-neutral-600 dark:text-neutral-300 mb-6">
        Please try again or request a new verification email.
      </p>
      <Link
        to="/auth/login"
        className="text-primary-500 hover:text-primary-600 font-medium"
      >
        Back to login
      </Link>
    </div>
  );
};

export default VerifyEmailPage;
