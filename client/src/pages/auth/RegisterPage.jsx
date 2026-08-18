// components/auth/RegisterPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button, Input, Select } from "../../components/common";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    plan: "free",
  });

  const [localError, setLocalError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    clearError();
    setLocalError("");
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setLocalError("Full name is required");
      return false;
    }
    if (!formData.email) {
      setLocalError("Email is required");
      return false;
    }
    if (formData.password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate("/dashboard");
    } catch (err) {
      // Error handled in hook
    }
  };

  const planOptions = [
    { value: "free", label: "Free" },
    { value: "pro", label: "Pro" },
    { value: "business", label: "Business" },
    { value: "enterprise", label: "Enterprise" },
  ];

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary-600">Create Account</h1>
        <p className="text-neutral-500 mt-2">Start managing your links today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          id="fullName"
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleChange}
          placeholder="John Doe"
          autoComplete="name"
          required
        />

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
          placeholder="Min 8 characters"
          autoComplete="new-password"
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
          placeholder="Re-enter password"
          autoComplete="new-password"
          required
        />

        <Select
          label="Select Plan"
          id="plan"
          name="plan"
          value={formData.plan}
          onChange={handleChange}
          options={planOptions}
          helper="You can upgrade later"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          disabled={loading}
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-neutral-600">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
