// src/components/url/UrlStats.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Alert, LoadingSpinner, Card } from "../common";
import useUrl from "../../hooks/useUrl";

const UrlStats = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getUrlStats, loading, error } = useUrl();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadStats();
    }
  }, [id]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await getUrlStats(id);
      setStats(data);
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

  if (!stats) {
    return (
      <div className="p-6">
        <Alert variant="warning">No statistics available</Alert>
        <div className="mt-4">
          <Button variant="primary" onClick={() => navigate(`/urls/${id}`)}>
            Back to URL Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">URL Statistics</h1>
          <p className="text-neutral-600">
            Statistical summary for your short URL
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate(`/urls/${id}`)}>
          Back to Details
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary-600">
            {stats.total_clicks}
          </div>
          <div className="text-sm text-neutral-600">Total Clicks</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary-600">
            {stats.unique_visitors}
          </div>
          <div className="text-sm text-neutral-600">Unique Visitors</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary-600">
            {stats.last_7_days}
          </div>
          <div className="text-sm text-neutral-600">Last 7 Days</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary-600">
            {stats.last_30_days}
          </div>
          <div className="text-sm text-neutral-600">Last 30 Days</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.bounce_rate !== undefined && (
          <Card className="p-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">
                Bounce Rate
              </label>
              <p className="text-xl font-semibold">{stats.bounce_rate}%</p>
            </div>
          </Card>
        )}
        {stats.avg_time_since_click !== undefined && (
          <Card className="p-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">
                Avg Time Since Click
              </label>
              <p className="text-xl font-semibold">
                {stats.avg_time_since_click} days
              </p>
            </div>
          </Card>
        )}
        {stats.last_clicked_at && (
          <Card className="p-4">
            <div>
              <label className="text-sm font-medium text-neutral-600">
                Last Clicked
              </label>
              <p className="text-xl font-semibold">
                {new Date(stats.last_clicked_at).toLocaleString()}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UrlStats;
