// components/auth/SessionsPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  Button,
  Card,
  Badge,
  LoadingSpinner,
  Alert,
  Table,
  IconWrapper,
} from "../common";
import {
  FaDesktop,
  FaMobile,
  FaTablet,
  FaTrash,
  FaTimes,
} from "react-icons/fa";

const SessionsPage = () => {
  const {
    sessions,
    sessionStats,
    currentSession,
    fetchSessions,
    fetchSessionStats,
    fetchCurrentSession,
    revokeSession,
    revokeAllSessions,
    loading,
  } = useAuth();

  const [revoking, setRevoking] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchSessions();
    fetchSessionStats();
    fetchCurrentSession();
  }, []);

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <FaDesktop />;
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile")) return <FaMobile />;
    if (ua.includes("tablet")) return <FaTablet />;
    return <FaDesktop />;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleRevoke = async (sessionToken) => {
    setRevoking(sessionToken);
    setError("");
    setSuccessMessage("");

    try {
      await revokeSession(sessionToken);
      setSuccessMessage("Session revoked successfully");
    } catch (err) {
      setError(err.message || "Failed to revoke session");
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Are you sure you want to revoke all other sessions?")) return;

    setError("");
    setSuccessMessage("");

    try {
      await revokeAllSessions();
      setSuccessMessage("All other sessions revoked successfully");
    } catch (err) {
      setError(err.message || "Failed to revoke sessions");
    }
  };

  if (loading && !sessions.length) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-primary-600">Sessions</h1>
        <Button
          variant="danger"
          size="sm"
          onClick={handleRevokeAll}
          loading={loading}
        >
          Revoke All Other Sessions
        </Button>
      </div>

      {/* Session Stats */}
      {sessionStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-neutral-500">Total Sessions</p>
            <p className="text-2xl font-bold">
              {sessionStats.total_sessions || 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-neutral-500">Active Sessions</p>
            <p className="text-2xl font-bold text-success">
              {sessionStats.active_sessions || 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-neutral-500">Last Activity</p>
            <p className="text-sm font-medium">
              {formatDate(sessionStats.last_activity)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-neutral-500">Session Created</p>
            <p className="text-sm font-medium">
              {formatDate(sessionStats.last_session_created)}
            </p>
          </Card>
        </div>
      )}

      {/* Messages */}
      {successMessage && (
        <Alert
          variant="success"
          className="mb-4"
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Sessions Table */}
      <Card className="p-4 sm:p-6 overflow-x-auto">
        <h2 className="text-lg font-bold mb-4">All Sessions</h2>

        {sessions.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">No sessions found</p>
        ) : (
          <Table
            headers={[
              "Device",
              "IP Address",
              "Created",
              "Last Activity",
              "Status",
              "Actions",
            ]}
            data={sessions.map((session) => ({
              device: (
                <div className="flex items-center gap-2">
                  {getDeviceIcon(session.user_agent)}
                  <span className="text-sm truncate max-w-[150px]">
                    {session.user_agent?.split(" ").slice(0, 3).join(" ") ||
                      "Unknown"}
                  </span>
                </div>
              ),
              ip: session.ip_address || "N/A",
              created: formatDate(session.created_at),
              lastActivity: formatDate(session.last_activity),
              status: (
                <Badge variant={session.is_active ? "success" : "neutral"}>
                  {session.is_active ? "Active" : "Inactive"}
                </Badge>
              ),
              actions:
                session.is_active && currentSession?.id !== session.id ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRevoke(session.id)}
                    loading={revoking === session.id}
                    disabled={revoking === session.id}
                  >
                    <FaTrash size={12} />
                  </Button>
                ) : (
                  <span className="text-xs text-neutral-400">
                    {currentSession?.id === session.id ? "Current" : "Inactive"}
                  </span>
                ),
            }))}
            className="min-w-[600px]"
          />
        )}
      </Card>
    </div>
  );
};

export default SessionsPage;
