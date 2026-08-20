import { Link } from "react-router-dom";
import { CodeIcon } from "lucide-react";
import { Button } from "../components/common/Button";

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-white border-b border-neutral-200 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-neutral-900">
            API Documentation
          </h1>
          <p className="text-xl text-neutral-500 mt-2 max-w-2xl">
            Integrate our powerful link shortening and analytics capabilities
            into your applications.
          </p>
        </div>
      </header>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-white rounded-xl border border-neutral-200 p-12">
            <CodeIcon className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              API Documentation
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto mb-6">
              Our comprehensive API documentation is being prepared for release.
            </p>
            <Link to="/contact">
              <Button variant="primary">Get API Access</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
