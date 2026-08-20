import { useState } from "react";
import { Link } from "react-router-dom";
import { MailIcon, PhoneIcon, MapPinIcon, SendIcon } from "lucide-react";
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import { Textarea } from "../components/common/Textarea";
import { Alert } from "../components/common/Alert";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactInfo = [
    {
      icon: <MailIcon className="w-6 h-6 text-primary-500" />,
      label: "Email",
      value: "support@shortify.io",
    },
    {
      icon: <PhoneIcon className="w-6 h-6 text-primary-500" />,
      label: "Phone",
      value: "+1 (555) 123-4567",
    },
    {
      icon: <MapPinIcon className="w-6 h-6 text-primary-500" />,
      label: "Address",
      value: "123 Tech Street, San Francisco, CA 94105",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900">
            Contact Us
          </h1>
          <p className="text-xl text-neutral-500 mt-2 max-w-2xl">
            Have questions? We'd love to hear from you. Get in touch with our
            team.
          </p>
        </div>
      </header>

      {/* Contact Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <div className="bg-white rounded-xl border border-neutral-200 p-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                Send a Message
              </h2>
              {success && (
                <Alert variant="success" onClose={() => setSuccess(false)}>
                  Message sent successfully! We'll get back to you soon.
                </Alert>
              )}
              {error && (
                <Alert variant="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
                <Input
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="What's this about?"
                />
                <Textarea
                  label="Message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Tell us how we can help..."
                />
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={submitting}
                >
                  <SendIcon className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-neutral-200 p-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                Get in Touch
              </h2>
              <p className="text-neutral-500 mb-6">
                We're here to help. Reach out to us via any of the channels
                below.
              </p>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      {info.icon}
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">{info.label}</p>
                      <p className="text-neutral-900 font-medium">
                        {info.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-neutral-200">
                <h3 className="font-semibold text-neutral-900 mb-2">
                  Office Hours
                </h3>
                <div className="space-y-1 text-sm text-neutral-600">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                  <p>Saturday: 10:00 AM - 4:00 PM EST</p>
                  <p>Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
