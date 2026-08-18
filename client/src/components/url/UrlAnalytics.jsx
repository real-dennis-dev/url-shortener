// src/components/url/UrlAnalytics.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Alert, LoadingSpinner, Card } from "../common";
import useUrl from "../../hooks/useUrl";

const UrlAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUrlAnalytics, loading, error } = useUrl();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadAnalytics();
    }
  }, [id]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await getUrlAnalytics(id);
      setAnalytics(data);
    } catch (err) {
      // Error handled by hook
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || loading) {
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
          <Button variant="primary" onClick={() => navigate(`/urls/${id}`)}>
            Back to URL Details
          </Button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <Alert variant="warning">No analytics data available</Alert>
        <div className="mt-4">
          <Button variant="primary" onClick={() => navigate(`/urls/${id}`)}>
            Back to URL Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">URL Analytics</h1>
          <p className="text-neutral-600">
            Detailed analytics for your short URL
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate(`/urls/${id}`)}>
          Back to Details
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary-600">
            {analytics.total_clicks}
          </div>
          <div className="text-sm text-neutral-600">Total Clicks</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary-600">
            {analytics.unique_visitors}
          </div>
          <div className="text-sm text-neutral-600">Unique Visitors</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary-600">
            {analytics.countries ? analytics.countries.length : 0}
          </div>
          <div className="text-sm text-neutral-600">Countries</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary-600">
            {analytics.referrers ? analytics.referrers.length : 0}
          </div>
          <div className="text-sm text-neutral-600">Referrers</div>
        </Card>
      </div>

      {/* Devices */}
      {analytics.devices && analytics.devices.length > 0 && (
        <div className="mb-6">
          <Card title="Devices" className="p-4">
            <div className="space-y-2">
              {analytics.devices.map((device, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{device.device_type}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-neutral-300 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (device.count / analytics.total_clicks) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-neutral-600">
                      {device.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Browsers */}
      {analytics.browsers && analytics.browsers.length > 0 && (
        <div className="mb-6">
          <Card title="Browsers" className="p-4">
            <div className="space-y-2">
              {analytics.browsers.map((browser, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{browser.browser}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-neutral-300 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (browser.count / analytics.total_clicks) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-neutral-600">
                      {browser.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Countries */}
      {analytics.countries && analytics.countries.length > 0 && (
        <div className="mb-6">
          <Card title="Countries" className="p-4">
            <div className="space-y-2">
              {analytics.countries.map((country, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{country.country}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-neutral-300 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (country.count / analytics.total_clicks) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-neutral-600">
                      {country.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Referrers */}
      {analytics.referrers && analytics.referrers.length > 0 && (
        <div className="mb-6">
          <Card title="Referrers" className="p-4">
            <div className="space-y-2">
              {analytics.referrers.map((referrer, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">
                    {referrer.referrer_domain}
                  </span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-neutral-300 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (referrer.count / analytics.total_clicks) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-neutral-600">
                      {referrer.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Timeline */}
      {analytics.timeline && analytics.timeline.length > 0 && (
        <div className="mb-6">
          <Card title="Timeline" className="p-4">
            <div className="space-y-2">
              {analytics.timeline.map((point, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{point.date}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 bg-neutral-300 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{
                          width: `${
                            (point.clicks / analytics.total_clicks) * 100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-neutral-600">
                      {point.clicks}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UrlAnalytics;
