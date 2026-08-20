import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-white border-b border-neutral-200 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-neutral-900">
            Terms of Service
          </h1>
          <p className="text-neutral-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </header>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl bg-white rounded-xl border border-neutral-200 p-8">
          <div className="prose max-w-none">
            <h2>Acceptance of Terms</h2>
            <p>
              By using Shortify, you agree to these Terms of Service. If you do
              not agree, please do not use our service.
            </p>

            <h2>Account Registration</h2>
            <p>
              You must be at least 13 years old to create an account. You are
              responsible for maintaining the confidentiality of your account
              credentials and for all activities under your account.
            </p>

            <h2>Use of Service</h2>
            <p>
              You agree to use our service only for lawful purposes and in
              accordance with these terms.
            </p>
            <ul>
              <li>Do not use the service for illegal activities</li>
              <li>Do not attempt to gain unauthorized access to our systems</li>
              <li>Do not abuse our infrastructure or resources</li>
              <li>Do not violate others' intellectual property rights</li>
              <li>Do not distribute malware or harmful content</li>
            </ul>

            <h2>Intellectual Property</h2>
            <p>
              Our service and its original content are protected by copyright
              and other intellectual property laws. You may not copy, modify, or
              distribute our content without permission.
            </p>

            <h2>User Content</h2>
            <p>
              You retain ownership of the content you create using our service.
              By using our service, you grant us a license to process and
              display your content as necessary to provide the service.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
              We provide our service "as is" and make no warranties about its
              reliability or suitability. We are not liable for any damages
              arising from your use of the service.
            </p>

            <h2>Termination</h2>
            <p>
              We reserve the right to terminate or suspend your account at any
              time for violations of these terms or for any other reason.
            </p>

            <h2>Changes to Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of our
              service after changes means you accept the new terms.
            </p>

            <h2>Contact</h2>
            <p>
              For questions about these terms, please contact us at{" "}
              <a
                href="mailto:legal@shortify.io"
                className="text-primary-500 hover:underline"
              >
                legal@shortify.io
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
