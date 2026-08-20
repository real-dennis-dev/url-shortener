import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAnalyticsContext } from "./AnalyticsProvider";
import {
  Button,
  Input,
  DatePicker,
  Dropdown,
  DropdownItem,
  Alert,
  LoadingSpinner,
} from "../common";

export default function AnalyticsExport() {
  const navigate = useNavigate();
  const { exportAnalytics, loading, error, dateRange, clearError } =
    useAnalyticsContext();

  const [urlId, setUrlId] = useState("");
  const [format, setFormat] = useState("csv");
  const [localDateRange, setLocalDateRange] = useState(dateRange);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!urlId) {
      return;
    }

    setIsExporting(true);
    await exportAnalytics(urlId, format, localDateRange);
    setIsExporting(false);
  };

  const handleReset = () => {
    setUrlId("");
    setFormat("csv");
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setLocalDateRange({
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/analytics/overview">
          <Button variant="ghost" size="sm">
            ← Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-neutral-900">
          Export Analytics
        </h1>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-neutral-600 mb-6">
            Export your URL analytics data in your preferred format. All exports
            include click data, device information, location data, and more.
          </p>

          {error && (
            <Alert variant="error" title="Export Failed" className="mb-4">
              {error}
            </Alert>
          )}

          <div className="space-y-4">
            {/* URL ID */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                URL ID (Required)
              </label>
              <Input
                placeholder="Enter the URL ID to export"
                value={urlId}
                onChange={(e) => setUrlId(e.target.value)}
                fullWidth
              />
              <p className="text-xs text-neutral-500 mt-1">
                Find the URL ID in the URL details page or in your list of URLs
              </p>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Export Format
              </label>
              <div className="flex gap-2">
                {["csv", "json", "excel"].map((fmt) => (
                  <Button
                    key={fmt}
                    variant={format === fmt ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setFormat(fmt)}
                  >
                    {fmt.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Start Date
                </label>
                <DatePicker
                  value={localDateRange.startDate}
                  onChange={(e) =>
                    setLocalDateRange({
                      ...localDateRange,
                      startDate: e.target.value,
                    })
                  }
                  type="date"
                  fullWidth
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  End Date
                </label>
                <DatePicker
                  value={localDateRange.endDate}
                  onChange={(e) =>
                    setLocalDateRange({
                      ...localDateRange,
                      endDate: e.target.value,
                    })
                  }
                  type="date"
                  fullWidth
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="primary"
                onClick={handleExport}
                disabled={!urlId || isExporting}
                loading={isExporting || loading}
                fullWidth
              >
                Export Data
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isExporting}
              >
                Reset
              </Button>
            </div>

            {/* Info */}
            <div className="bg-neutral-50 rounded p-4 text-sm text-neutral-600">
              <p className="font-medium mb-1">What's included in the export:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>URL information and metadata</li>
                <li>Click timestamps and counts</li>
                <li>Device and browser breakdown</li>
                <li>Geographic location data</li>
                <li>Referrer information</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
