import { createContext, useContext, useEffect } from "react";
import useNotifications from "../../hooks/useNotifications";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const notifications = useNotifications();

  // Start polling for unread count when component mounts
  useEffect(() => {
    notifications.startPolling(30000);
    return () => {
      notifications.stopPolling();
    };
  }, []);

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
}
