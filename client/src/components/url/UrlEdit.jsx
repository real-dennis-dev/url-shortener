// src/components/url/UrlEdit.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Input, Textarea, Alert, LoadingSpinner } from "../common";
import useUrl from "../../hooks/useUrl";

const UrlEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUrl, loading, error, getUrlDetails, updateUrl } = useUrl();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tags: "",
    is_active: true,
    status: "active",
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      getUrlDetails(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentUrl) {
      setFormData({
        title: currentUrl.title || "",
        description: currentUrl.description || "",
        tags: currentUrl.tags || "",
        is_active: currentUrl.is_active !== false,
        status: currentUrl.status || "active",
      });
    }
  }, [currentUrl]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        title: formData.title || undefined,
        description: formData.description || undefined,
        tags: formData.tags || undefined,
        is_active: formData.is_active,
        status: formData.status,
      };
      await updateUrl(id, data);
      navigate(`/urls/${id}`);
    } catch (err) {
      // Error handled by hook
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="primary" onClick={() => navigate("/urls")}>
            Back to URLs
          </Button>
        </div>
      </div>
    );
  }

  if (!currentUrl) {
    return (
      <div className="p-6">
        <Alert variant="warning">URL not found</Alert>
        <div className="mt-4">
          <Button variant="primary" onClick={() => navigate("/urls")}>
            Back to URLs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit URL</h1>
        <p className="text-neutral-600">Update your short URL details</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-neutral-200 p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">URL Information</h2>
          <div className="mb-2">
            <label className="block text-sm font-medium text-neutral-700">
              Short URL
            </label>
            <a
              href={currentUrl.short_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              {currentUrl.short_url}
            </a>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-neutral-700">
              Original URL
            </label>
            <a
              href={currentUrl.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline break-all"
            >
              {currentUrl.original_url}
            </a>
          </div>
          <hr className="border-neutral-300" />
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter title"
            fullWidth
          />
          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter description"
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

        <div className="bg-neutral-200 p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold">Status</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4"
              />
              Active
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(`/urls/${id}`)}
            type="button"
          >
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isLoading}>
            Update URL
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UrlEdit;
