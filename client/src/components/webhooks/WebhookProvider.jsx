import { createContext, useContext } from "react";
import useWebhook from "../../hooks/useWebhook";

const WebhookContext = createContext(null);

export function WebhookProvider({ children }) {
  const webhook = useWebhook();

  return (
    <WebhookContext.Provider value={webhook}>
      {children}
    </WebhookContext.Provider>
  );
}

export function useWebhookContext() {
  const context = useContext(WebhookContext);
  if (!context) {
    throw new Error("useWebhookContext must be used within a WebhookProvider");
  }
  return context;
}
