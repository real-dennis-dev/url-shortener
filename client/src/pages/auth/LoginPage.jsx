// components/auth/LoginPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button, Input, Checkbox } from "../../components/common";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [localError, setLocalError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    clearError();
    setLocalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.password) {
      setLocalError("Please fill in all fields");
      return;
    }

    try {
      await login(formData.email, formData.password, formData.rememberMe);
      navigate("/dashboard");
    } catch (err) {
      // Error handled in hook
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary-600">Welcome Back</h1>
        <p className="text-neutral-500 mt-2">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="user@example.com"
          autoComplete="email"
          required
          error={localError || error}
        />

        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />

        <div className="flex items-center justify-between">
          <Checkbox
            id="rememberMe"
            name="rememberMe"
            label="Remember me"
            checked={formData.rememberMe}
            onChange={handleChange}
          />

          <Link
            to="/auth/forgot-password"
            className="text-sm text-primary-500 hover:text-primary-600 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Don't have an account?{" "}
          <Link
            to="/auth/register"
            className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
