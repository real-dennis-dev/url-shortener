import { Link } from "react-router-dom";

export default function Cookies() {
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
          <h1 className="text-4xl font-bold text-neutral-900">Cookie Policy</h1>
          <p className="text-neutral-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </header>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl bg-white rounded-xl border border-neutral-200 p-8">
          <div className="prose max-w-none">
            <h2>What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device when you visit
              websites. They help us improve your experience by remembering your
              preferences and understanding how you use our service.
            </p>

            <h2>Types of Cookies We Use</h2>
            <ul>
              <li>
                <strong>Essential Cookies:</strong> Required for basic
                functionality of our service.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Help us understand how users
                interact with our platform.
              </li>
              <li>
                <strong>Preference Cookies:</strong> Remember your settings and
                preferences.
              </li>
              <li>
                <strong>Security Cookies:</strong> Help protect your account and
                our service.
              </li>
            </ul>

            <h2>How We Use Cookies</h2>
            <ul>
              <li>To authenticate and maintain your session</li>
              <li>To remember your preferences and settings</li>
              <li>To analyze usage patterns and improve our service</li>
              <li>To provide personalized content and recommendations</li>
            </ul>

            <h2>Your Control Over Cookies</h2>
            <p>
              You can control and manage cookies through your browser settings.
              However, disabling certain cookies may affect the functionality of
              our service.
            </p>

            <h2>Third-Party Cookies</h2>
            <p>
              We may use third-party services that also set cookies. These
              services help us with analytics, marketing, and providing
              additional features.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. We will notify
              you of any changes by posting the new policy on this page.
            </p>

            <h2>Contact</h2>
            <p>
              If you have questions about our Cookie Policy, please contact us
              at{" "}
              <a
                href="mailto:privacy@shortify.io"
                className="text-primary-500 hover:underline"
              >
                privacy@shortify.io
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
