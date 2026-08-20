import { Link } from "react-router-dom";

export default function Privacy() {
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
            Privacy Policy
          </h1>
          <p className="text-neutral-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </header>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl bg-white rounded-xl border border-neutral-200 p-8">
          <div className="prose max-w-none">
            <h2>Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when
              you create an account, use our services, or contact us for
              support. This may include:
            </p>
            <ul>
              <li>Name and email address</li>
              <li>Account credentials</li>
              <li>
                Payment information (processed securely by our payment partners)
              </li>
              <li>URLs you create and manage</li>
              <li>Communications with us</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Analyze usage patterns and improve user experience</li>
              <li>Protect against fraudulent or unauthorized activity</li>
            </ul>

            <h2>Information Sharing</h2>
            <p>
              We do not share your personal information with third parties
              except in the following cases:
            </p>
            <ul>
              <li>With your consent or at your direction</li>
              <li>To comply with legal obligations</li>
              <li>To protect the rights and safety of our users</li>
              <li>With service providers who assist in our operations</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We take reasonable measures to protect your information from
              unauthorized access, alteration, or destruction. However, no
              method of transmission over the internet is 100% secure.
            </p>

            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and update your personal information</li>
              <li>Request deletion of your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Object to certain data processing</li>
            </ul>

            <h2>Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to enhance your
              experience on our platform. You can control cookie preferences in
              your browser settings.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on this page.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us
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
