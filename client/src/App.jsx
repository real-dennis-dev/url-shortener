// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import authRoutes from "./routes/authRoutes";

// Import other route modules as they're created
// import dashboardRoutes from './routes/dashboardRoutes';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          {authRoutes.map((route, index) => (
            <Route key={index} {...route} />
          ))}

          {/* Dashboard Routes */}
          {/* {dashboardRoutes.map((route, index) => (
            <Route key={index} {...route} />
          ))} */}

          {/* Catch all - 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
