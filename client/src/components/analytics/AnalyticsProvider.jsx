import { createContext, useContext } from "react";
import useAnalytics from "../../hooks/useAnalytics";

const AnalyticsContext = createContext(null);

export function AnalyticsProvider({ children }) {
  const analytics = useAnalytics();

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error(
      "useAnalyticsContext must be used within an AnalyticsProvider"
    );
  }
  return context;
}
