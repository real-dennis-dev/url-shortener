// src/components/url/UrlDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button, Badge, Alert, LoadingSpinner, Card } from "../common";
import useUrl from "../../hooks/useUrl";
import { formatDate, getStatusBadgeVariant } from "../../utils/helpers";

const UrlDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUrl, loading, error, getUrlDetails, deleteUrl } = useUrl();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id) {
      getUrlDetails(id);
    }
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteUrl(id);
      navigate("/urls");
    } catch (err) {
      // Error handled by hook
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
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {currentUrl.title || "URL Details"}
          </h1>
          <p className="text-neutral-600">ID: {currentUrl.id}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/urls/${id}/edit`)}
          >
            ✏️ Edit
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/urls/${id}/analytics`)}
          >
            📊 Analytics
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/urls/${id}/stats`)}
          >
            📈 Stats
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            🗑️ Delete
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="mb-6 flex items-center gap-3">
        <Badge variant={getStatusBadgeVariant(currentUrl.status)} size="lg">
          {currentUrl.status}
        </Badge>
        {currentUrl.requires_password && (
          <Badge variant="warning" size="lg">
            🔒 Password Protected
          </Badge>
        )}
        {currentUrl.expires_at && (
          <Badge variant="info" size="lg">
            ⏰ Expires: {formatDate(currentUrl.expires_at)}
          </Badge>
        )}
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Short URL" className="p-4">
          <div className="flex items-center gap-3">
            <a
              href={currentUrl.short_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline font-medium"
            >
              {currentUrl.short_url}
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigator.clipboard.writeText(currentUrl.short_url)
              }
            >
              📋
            </Button>
          </div>
          <div className="mt-2 text-sm text-neutral-600">
            Short Code:{" "}
            <span className="font-mono">{currentUrl.short_code}</span>
          </div>
        </Card>

        <Card title="Original URL" className="p-4">
          <a
            href={currentUrl.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline break-all"
          >
            {currentUrl.original_url}
          </a>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {currentUrl.description && (
          <Card title="Description" className="p-4">
            <p className="text-neutral-700">{currentUrl.description}</p>
          </Card>
        )}
        {currentUrl.tags && (
          <Card title="Tags" className="p-4">
            <div className="flex flex-wrap gap-2">
              {currentUrl.tags.split(",").map((tag, index) => (
                <Badge key={index} variant="neutral">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* UTM Parameters */}
      {currentUrl.utm_source && (
        <div className="mt-6">
          <Card title="UTM Parameters" className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {currentUrl.utm_source && (
                <div>
                  <label className="text-sm font-medium text-neutral-600">
                    Source
                  </label>
                  <p>{currentUrl.utm_source}</p>
                </div>
              )}
              {currentUrl.utm_medium && (
                <div>
                  <label className="text-sm font-medium text-neutral-600">
                    Medium
                  </label>
                  <p>{currentUrl.utm_medium}</p>
                </div>
              )}
              {currentUrl.utm_campaign && (
                <div>
                  <label className="text-sm font-medium text-neutral-600">
                    Campaign
                  </label>
                  <p>{currentUrl.utm_campaign}</p>
                </div>
              )}
              {currentUrl.utm_term && (
                <div>
                  <label className="text-sm font-medium text-neutral-600">
                    Term
                  </label>
                  <p>{currentUrl.utm_term}</p>
                </div>
              )}
              {currentUrl.utm_content && (
                <div>
                  <label className="text-sm font-medium text-neutral-600">
                    Content
                  </label>
                  <p>{currentUrl.utm_content}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">
            {currentUrl.click_count}
          </div>
          <div className="text-sm text-neutral-600">Total Clicks</div>
        </Card>
        {currentUrl.last_clicked_at && (
          <Card className="p-4 text-center">
            <div className="text-sm font-medium">Last Clicked</div>
            <div className="text-sm text-neutral-600">
              {formatDate(currentUrl.last_clicked_at)}
            </div>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-between text-sm text-neutral-600">
        <div>Created: {formatDate(currentUrl.created_at)}</div>
        <div>Updated: {formatDate(currentUrl.updated_at)}</div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Delete URL</h2>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete "
              {currentUrl.title || currentUrl.original_url}"? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrlDetail;
