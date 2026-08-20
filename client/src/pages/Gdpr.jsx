import { Link } from "react-router-dom";

export default function Gdpr() {
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
            GDPR Compliance
          </h1>
          <p className="text-neutral-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </header>

      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl bg-white rounded-xl border border-neutral-200 p-8">
          <div className="prose max-w-none">
            <h2>Our Commitment</h2>
            <p>
              We are committed to protecting the privacy and personal data of
              our users in compliance with the General Data Protection
              Regulation (GDPR).
            </p>

            <h2>Data Controller</h2>
            <p>
              Shortify acts as the data controller for the personal data we
              collect from our users. We are responsible for ensuring that your
              data is processed in accordance with GDPR requirements.
            </p>

            <h2>Lawful Basis for Processing</h2>
            <p>
              We process your personal data based on the following lawful bases:
            </p>
            <ul>
              <li>
                <strong>Contractual Necessity:</strong> Processing is necessary
                for the performance of a contract with you.
              </li>
              <li>
                <strong>Legitimate Interests:</strong> Processing is necessary
                for our legitimate business interests, such as improving our
                services.
              </li>
              <li>
                <strong>Consent:</strong> We may ask for your consent for
                specific processing activities.
              </li>
              <li>
                <strong>Legal Obligations:</strong> Processing is necessary to
                comply with legal requirements.
              </li>
            </ul>

            <h2>Your Rights Under GDPR</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul>
              <li>
                <strong>Right to Access:</strong> You can request access to your
                personal data that we hold.
              </li>
              <li>
                <strong>Right to Rectification:</strong> You can request
                corrections to inaccurate data.
              </li>
              <li>
                <strong>Right to Erasure:</strong> You can request deletion of
                your data ("right to be forgotten").
              </li>
              <li>
                <strong>Right to Restrict Processing:</strong> You can request
                restriction of data processing.
              </li>
              <li>
                <strong>Right to Data Portability:</strong> You can request your
                data in a portable format.
              </li>
              <li>
                <strong>Right to Object:</strong> You can object to certain data
                processing activities.
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> You can withdraw
                your consent at any time.
              </li>
            </ul>

            <h2>Data Retention</h2>
            <p>
              We retain your personal data only as long as necessary to provide
              our services and fulfill legal obligations. We regularly review
              our data retention practices.
            </p>

            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal data against unauthorized access,
              alteration, or destruction.
            </p>

            <h2>Data Transfers</h2>
            <p>
              We may transfer your data to countries outside the EU/EEA. We
              ensure that such transfers comply with GDPR requirements through
              appropriate safeguards.
            </p>

            <h2>Data Breach Notification</h2>
            <p>
              In the event of a data breach that poses a risk to your rights and
              freedoms, we will notify you and the relevant supervisory
              authority within 72 hours.
            </p>

            <h2>Data Protection Officer</h2>
            <p>
              We have appointed a Data Protection Officer (DPO) who can be
              contacted at{" "}
              <a
                href="mailto:dpo@shortify.io"
                className="text-primary-500 hover:underline"
              >
                dpo@shortify.io
              </a>
              for any questions regarding our GDPR compliance.
            </p>

            <h2>Right to Lodge a Complaint</h2>
            <p>
              If you believe we have not complied with GDPR requirements, you
              have the right to lodge a complaint with your national data
              protection authority.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
