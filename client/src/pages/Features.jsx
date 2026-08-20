import { Link } from "react-router-dom";
import {
  ZapIcon,
  ShieldIcon,
  ChartBarIcon,
  GlobeIcon,
  LinkIcon,
  BellIcon,
  UsersIcon,
  SettingsIcon,
  CodeIcon,
  DatabaseIcon,
  CloudIcon,
  LockIcon,
} from "lucide-react";
import { Button } from "../components/common/Button";

export default function Features() {
  const features = [
    {
      icon: <ZapIcon className="w-8 h-8 text-primary-500" />,
      title: "Lightning Fast",
      description:
        "Shorten URLs instantly with our high-performance infrastructure powered by edge caching.",
      benefits: [
        "Sub-50ms response time",
        "Global CDN distribution",
        "99.9% uptime SLA",
      ],
    },
    {
      icon: <ShieldIcon className="w-8 h-8 text-primary-500" />,
      title: "Enterprise Security",
      description:
        "Bank-grade security with SSL encryption, DDoS protection, and advanced threat detection.",
      benefits: [
        "256-bit SSL encryption",
        "DDoS protection",
        "Advanced threat monitoring",
      ],
    },
    {
      icon: <ChartBarIcon className="w-8 h-8 text-primary-500" />,
      title: "Advanced Analytics",
      description:
        "Track every click with detailed insights including geography, devices, and engagement patterns.",
      benefits: [
        "Real-time click tracking",
        "Geographic analytics",
        "Device & browser stats",
      ],
    },
    {
      icon: <GlobeIcon className="w-8 h-8 text-primary-500" />,
      title: "Global Reach",
      description:
        "CDN-powered links with 99.9% uptime across the globe in 50+ edge locations.",
      benefits: [
        "50+ edge locations",
        "Automatic failover",
        "Low latency worldwide",
      ],
    },
    {
      icon: <LinkIcon className="w-8 h-8 text-primary-500" />,
      title: "Custom Domains",
      description:
        "Create branded short links with your own custom domain for professional appearance.",
      benefits: [
        "Bring your own domain",
        "Branded short links",
        "SSL certificate included",
      ],
    },
    {
      icon: <BellIcon className="w-8 h-8 text-primary-500" />,
      title: "Real-time Notifications",
      description:
        "Get instant alerts for clicks, conversions, and important events via webhooks and email.",
      benefits: [
        "Webhook integrations",
        "Email notifications",
        "Real-time alerts",
      ],
    },
    {
      icon: <UsersIcon className="w-8 h-8 text-primary-500" />,
      title: "Team Collaboration",
      description:
        "Work seamlessly with your team with role-based access control and shared workspaces.",
      benefits: [
        "Role-based permissions",
        "Shared workspaces",
        "Activity logs",
      ],
    },
    {
      icon: <CodeIcon className="w-8 h-8 text-primary-500" />,
      title: "Developer API",
      description:
        "Integrate our powerful link shortening and analytics capabilities into your applications.",
      benefits: ["RESTful API", "Webhook support", "SDKs available"],
    },
    {
      icon: <DatabaseIcon className="w-8 h-8 text-primary-500" />,
      title: "Bulk Operations",
      description:
        "Upload and manage thousands of URLs at once with our powerful bulk import and export tools.",
      benefits: ["CSV/Excel import", "Bulk editing", "Export analytics"],
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
            Features
          </h1>
          <p className="text-xl text-neutral-500 mt-2 max-w-2xl">
            Everything you need to manage, track, and optimize your links.
          </p>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-accent-100 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-500 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-neutral-600"
                    >
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust our platform for their link
            management needs.
          </p>
          <Link to="/register">
            <Button
              variant="success"
              size="lg"
              className="bg-white text-primary-600 hover:bg-neutral-100"
            >
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
