// contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import AuthService from "../services/auth.service";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!user;

  const checkAuth = async () => {
    try {
      const response = await AuthService.me();
      const authData = response.data;

      if (authData.isAuthenticated) {
        console.log(authData);
        setUser(authData.user);
      } else {
        console.log(authData);
        setUser(null);
      }
    } catch (err) {
      console.error("checkAuth failed:", err.response?.status, err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password, deviceInfo) => {
    const response = await AuthService.login(email, password, deviceInfo);
    setUser(response.data.user);
    return response;
  };

  const register = async (data) => {
    const response = await AuthService.register(data);
    setUser(response.data.user);
    return response;
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser, // Expose setUser for hooks to update
        loading,
        isAuthenticated,
        login,
        logout,
        register,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
