import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { HomeIcon, ArrowLeftIcon, SearchIcon } from "lucide-react";
import { Button } from "./common/Button";

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-8xl font-bold text-primary-500 opacity-10">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <SearchIcon className="w-24 h-24 text-neutral-400" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-neutral-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-neutral-500 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={isAuthenticated ? "/dashboard" : "/"}>
            <Button variant="primary" fullWidth>
              <HomeIcon className="w-4 h-4 mr-2" />
              {isAuthenticated ? "Go to Dashboard" : "Go to Home"}
            </Button>
          </Link>
          <Button
            variant="outline"
            fullWidth
            onClick={() => window.history.back()}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Quick Links */}
        <div className="mt-8 pt-8 border-t border-neutral-200">
          <p className="text-sm text-neutral-400 mb-3">
            Try these pages instead:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-primary-500 hover:underline text-sm"
                >
                  Dashboard
                </Link>
                <Link
                  to="/url/list"
                  className="text-primary-500 hover:underline text-sm"
                >
                  My URLs
                </Link>
                <Link
                  to="/analytics"
                  className="text-primary-500 hover:underline text-sm"
                >
                  Analytics
                </Link>
                <Link
                  to="/settings/profile"
                  className="text-primary-500 hover:underline text-sm"
                >
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/"
                  className="text-primary-500 hover:underline text-sm"
                >
                  Home
                </Link>
                <Link
                  to="/login"
                  className="text-primary-500 hover:underline text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-primary-500 hover:underline text-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
