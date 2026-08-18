import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <h1 className="text-6xl font-bold text-indigo-600">404</h1>
      <p className="mt-4 text-xl text-slate-600">Page not found</p>
      <Link
        to="/"
        className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Go home
      </Link>
    </div>
  );
}
