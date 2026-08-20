import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowRightIcon,
  CheckIcon,
  ShieldIcon,
  ZapIcon,
  GlobeIcon,
  ChartBarIcon,
  LinkIcon,
  UsersIcon,
  BellIcon,
} from "lucide-react";
import { Button } from "./common/Button";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <ZapIcon className="w-6 h-6 text-primary-500" />,
      title: "Lightning Fast",
      description:
        "Shorten URLs instantly with our high-performance infrastructure.",
    },
    {
      icon: <ShieldIcon className="w-6 h-6 text-primary-500" />,
      title: "Secure & Reliable",
      description:
        "Enterprise-grade security with SSL encryption and advanced protection.",
    },
    {
      icon: <ChartBarIcon className="w-6 h-6 text-primary-500" />,
      title: "Advanced Analytics",
      description:
        "Track clicks, locations, devices, and engagement in real-time.",
    },
    {
      icon: <GlobeIcon className="w-6 h-6 text-primary-500" />,
      title: "Global Reach",
      description: "CDN-powered links with 99.9% uptime across the globe.",
    },
    {
      icon: <LinkIcon className="w-6 h-6 text-primary-500" />,
      title: "Custom Links",
      description: "Create branded short links with your own custom domain.",
    },
    {
      icon: <BellIcon className="w-6 h-6 text-primary-500" />,
      title: "Real-time Notifications",
      description:
        "Get instant alerts for clicks, conversions, and important events.",
    },
  ];

  const stats = [
    { label: "Links Created", value: "10M+" },
    { label: "Daily Clicks", value: "5M+" },
    { label: "Active Users", value: "100K+" },
    { label: "Uptime", value: "99.9%" },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        "100 links/month",
        "Basic analytics",
        "5 custom domains",
        "24/7 support",
      ],
      buttonText: "Get Started",
      buttonVariant: "outline",
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "For professionals and teams",
      features: [
        "10,000 links/month",
        "Advanced analytics",
        "50 custom domains",
        "Priority support",
        "Team collaboration",
        "API access",
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "primary",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        "Unlimited links",
        "Enterprise analytics",
        "Unlimited domains",
        "Dedicated support",
        "SSO integration",
        "Custom contracts",
        "SLA guarantee",
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">Shortify</span>
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm">
                  Dashboard
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-accent-100 text-primary-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <ZapIcon className="w-4 h-4" />
              <span>Powerful URL Shortener</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 leading-tight mb-6">
              Shorten, Share, and
              <br />
              <span className="text-primary-500">Track Your Links</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto mb-8">
              Create short, memorable links with powerful analytics, custom
              domains, and real-time tracking — all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={isAuthenticated ? "/dashboard" : "/register"}>
                <Button variant="primary" size="lg">
                  Get Started Free
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="#features">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-neutral-200">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-3xl font-bold text-primary-500">
                    {stat.value}
                  </p>
                  <p className="text-sm text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Powerful features to help you manage, track, and optimize your
              links.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-neutral-200 hover:border-primary-400 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Start free and upgrade as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-xl border ${
                  plan.popular
                    ? "border-primary-500 shadow-xl bg-white"
                    : "border-neutral-200 bg-white"
                } transition-all duration-300 hover:shadow-lg`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-500 text-white text-xs font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-neutral-900">
                    {plan.name}
                  </h3>
                  <div className="mt-2">
                    <span className="text-4xl font-bold text-neutral-900">
                      {plan.price}
                    </span>
                    <span className="text-neutral-500">{plan.period}</span>
                  </div>
                  <p className="text-neutral-500 text-sm mt-1">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 text-sm text-neutral-600"
                    >
                      <CheckIcon className="w-4 h-4 text-success flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link to={isAuthenticated ? "/dashboard" : "/register"}>
                  <Button
                    variant={plan.buttonVariant}
                    fullWidth
                    className={plan.popular ? "shadow-md" : ""}
                  >
                    {plan.buttonText}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 px-4 bg-primary-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of users who trust Shortify for their link management
            needs.
          </p>
          <Link to={isAuthenticated ? "/dashboard" : "/register"}>
            <Button
              variant="success"
              size="lg"
              className="bg-white text-primary-600 hover:bg-neutral-100"
            >
              Start Your Free Trial
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Shortify</span>
              </div>
              <p className="text-neutral-400 text-sm">
                Shorten, share, and track your links with powerful analytics and
                custom domains.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <Link
                    to="/features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/integrations"
                    className="hover:text-white transition-colors"
                  >
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link
                    to="/api-docs"
                    className="hover:text-white transition-colors"
                  >
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-white transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="hover:text-white transition-colors"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    to="/careers"
                    className="hover:text-white transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <Link
                    to="/privacy"
                    className="hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cookies"
                    className="hover:text-white transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/gdpr"
                    className="hover:text-white transition-colors"
                  >
                    GDPR
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-400">
              &copy; {new Date().getFullYear()} Shortify. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                to="#"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Twitter
              </Link>
              <Link
                to="#"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                GitHub
              </Link>
              <Link
                to="#"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                LinkedIn
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
