// src/components/url/UrlBulkCreate.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Textarea, Alert, Table, Card } from "../common";
import useUrl from "../../hooks/useUrl";

const UrlBulkCreate = () => {
  const navigate = useNavigate();
  const { bulkCreateUrls, loading, error } = useUrl();

  const [urlsText, setUrlsText] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState(null);

  const handleParseUrls = () => {
    try {
      const lines = urlsText.split("\n").filter((line) => line.trim());
      const parsed = lines.map((line) => {
        const parts = line.split(",").map((part) => part.trim());
        const [original_url, custom_code, title, tags] = parts;
        const item = { original_url };
        if (custom_code) item.custom_code = custom_code;
        if (title) item.title = title;
        if (tags) item.tags = tags;
        return item;
      });
      setPreviewData(parsed);
      setShowPreview(true);
    } catch (err) {
      // Handle parsing error
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await bulkCreateUrls(previewData);
      setResult(response);
      // Don't navigate away, show results
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bulk Create URLs</h1>
        <p className="text-neutral-600">Create multiple short URLs at once</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {result && (
        <Alert variant="success" className="mb-4">
          <div>
            <strong>Bulk creation completed!</strong>
            <div className="mt-2">
              <p>Successful: {result.successful}</p>
              <p>Failed: {result.failed}</p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/urls")}
              className="mt-2"
            >
              View All URLs
            </Button>
          </div>
        </Alert>
      )}

      {!result && (
        <div className="space-y-6">
          <Card title="Upload URLs" className="p-4">
            <p className="text-sm text-neutral-600 mb-2">
              Enter one URL per line. Format:{" "}
              <code>original_url, custom_code, title, tags</code>
            </p>
            <div className="text-sm text-neutral-600 mb-4">
              Example:
              <br />
              <code>https://example.com/1, code1, My Link 1, tech,blog</code>
              <br />
              <code>https://example.com/2, code2, My Link 2, design</code>
            </div>
            <Textarea
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              placeholder="Enter your URLs here..."
              rows={10}
              fullWidth
            />
            <div className="mt-4 flex gap-3">
              <Button variant="outline" onClick={handleParseUrls}>
                Preview URLs
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={loading}
                disabled={!showPreview}
              >
                Create All URLs
              </Button>
            </div>
          </Card>

          {showPreview && previewData.length > 0 && (
            <Card title="Preview" className="p-4">
              <Table
                headers={["Original URL", "Custom Code", "Title", "Tags"]}
                data={previewData.map((item) => ({
                  original_url: item.original_url,
                  custom_code: item.custom_code || "-",
                  title: item.title || "-",
                  tags: item.tags || "-",
                }))}
              />
              <div className="mt-2 text-sm text-neutral-600">
                Total: {previewData.length} URLs
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default UrlBulkCreate;
