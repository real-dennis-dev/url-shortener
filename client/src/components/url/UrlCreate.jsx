// src/components/url/UrlCreate.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Textarea, Alert, Checkbox } from "../common";
import useUrl from "../../hooks/useUrl";

const UrlCreate = () => {
  const navigate = useNavigate();
  const { createUrl, loading, error } = useUrl();

  const [formData, setFormData] = useState({
    original_url: "",
    custom_code: "",
    title: "",
    description: "",
    tags: "",
    password: "",
    expires_at: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_term: "",
    utm_content: "",
    domain_redirect: "",
    hasPassword: false,
    hasExpiration: false,
    hasUTM: false,
    hasDomainRedirect: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare data for API
    const data = {
      original_url: formData.original_url,
      ...(formData.custom_code && { custom_code: formData.custom_code }),
      ...(formData.title && { title: formData.title }),
      ...(formData.description && { description: formData.description }),
      ...(formData.tags && { tags: formData.tags }),
      ...(formData.hasPassword &&
        formData.password && { password: formData.password }),
      ...(formData.hasExpiration &&
        formData.expires_at && { expires_at: formData.expires_at }),
      ...(formData.hasUTM && {
        utm_source: formData.utm_source || undefined,
        utm_medium: formData.utm_medium || undefined,
        utm_campaign: formData.utm_campaign || undefined,
        utm_term: formData.utm_term || undefined,
        utm_content: formData.utm_content || undefined,
      }),
      ...(formData.hasDomainRedirect &&
        formData.domain_redirect && {
          domain_redirect: formData.domain_redirect,
        }),
    };

    try {
      await createUrl(data);
      navigate("/urls");
    } catch (err) {
      // Error is already handled by hook
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Short URL</h1>
        <p className="text-neutral-600">
          Create a new short URL with custom options
        </p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Required Fields */}
        <div className="bg-neutral-200 p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Required Information</h2>
          <Input
            label="Original URL"
            name="original_url"
            value={formData.original_url}
            onChange={handleChange}
            placeholder="https://example.com/very/long/url"
            required
            fullWidth
          />
          <Input
            label="Custom Code (Optional)"
            name="custom_code"
            value={formData.custom_code}
            onChange={handleChange}
            placeholder="mylink123"
            helper="3-20 characters, alphanumeric, underscores, and hyphens only"
            fullWidth
          />
        </div>

        {/* Details */}
        <div className="bg-neutral-200 p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Details</h2>
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="My Awesome Link"
            fullWidth
          />
          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="A link to my awesome content"
            rows={3}
            fullWidth
          />
          <Input
            label="Tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="tech,blog,awesome"
            helper="Comma-separated tags"
            fullWidth
          />
        </div>

        {/* Security */}
        <div className="bg-neutral-200 p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Security Options</h2>
          <Checkbox
            label="Set Password Protection"
            name="hasPassword"
            checked={formData.hasPassword}
            onChange={handleChange}
          />
          {formData.hasPassword && (
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              helper="Minimum 4 characters"
              fullWidth
            />
          )}
          <Checkbox
            label="Set Expiration Date"
            name="hasExpiration"
            checked={formData.hasExpiration}
            onChange={handleChange}
          />
          {formData.hasExpiration && (
            <Input
              label="Expires At"
              name="expires_at"
              type="datetime-local"
              value={formData.expires_at}
              onChange={handleChange}
              fullWidth
            />
          )}
        </div>

        {/* UTM Parameters */}
        <div className="bg-neutral-200 p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">UTM Parameters</h2>
          <Checkbox
            label="Add UTM Parameters"
            name="hasUTM"
            checked={formData.hasUTM}
            onChange={handleChange}
          />
          {formData.hasUTM && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="UTM Source"
                name="utm_source"
                value={formData.utm_source}
                onChange={handleChange}
                placeholder="newsletter"
              />
              <Input
                label="UTM Medium"
                name="utm_medium"
                value={formData.utm_medium}
                onChange={handleChange}
                placeholder="email"
              />
              <Input
                label="UTM Campaign"
                name="utm_campaign"
                value={formData.utm_campaign}
                onChange={handleChange}
                placeholder="spring_sale"
              />
              <Input
                label="UTM Term"
                name="utm_term"
                value={formData.utm_term}
                onChange={handleChange}
                placeholder="discount"
              />
              <Input
                label="UTM Content"
                name="utm_content"
                value={formData.utm_content}
                onChange={handleChange}
                placeholder="banner"
                fullWidth
              />
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <div className="bg-neutral-200 p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Advanced Options</h2>
          <Checkbox
            label="Set Domain Redirect"
            name="hasDomainRedirect"
            checked={formData.hasDomainRedirect}
            onChange={handleChange}
          />
          {formData.hasDomainRedirect && (
            <Input
              label="Domain Redirect URL"
              name="domain_redirect"
              value={formData.domain_redirect}
              onChange={handleChange}
              placeholder="https://custom-domain.com"
              fullWidth
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/urls")}
            type="button"
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Create URL
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UrlCreate;
