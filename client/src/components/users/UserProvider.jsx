import { createContext, useContext } from "react";
import useUser from "../../hooks/useUser";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const user = useUser();

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
