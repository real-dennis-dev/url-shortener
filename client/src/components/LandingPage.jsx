import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-indigo-700">YourApp</div>
        <div className="flex gap-4">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight">
          Build something
          <span className="text-indigo-600"> amazing</span>
        </h1>
        <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
          The modern platform for teams who want to move fast and stay
          organized.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          {!isAuthenticated && (
            <Link
              to="/register"
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-lg font-semibold hover:bg-indigo-700 shadow-lg hover:shadow-xl transition"
            >
              Get started free
            </Link>
          )}
          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="px-8 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition"
          >
            {isAuthenticated ? "Open Dashboard" : "Log in"}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {[
          {
            title: "Fast & Secure",
            desc: "Built with modern authentication and performance in mind.",
          },
          {
            title: "Beautiful UI",
            desc: "Clean, responsive design that works on every device.",
          },
          {
            title: "Ready to Scale",
            desc: "From solo projects to growing teams.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
          >
            <h3 className="text-xl font-semibold text-slate-800">{f.title}</h3>
            <p className="mt-2 text-slate-600">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-20 py-8 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} YourApp. All rights reserved.
      </footer>
    </div>
  );
}
