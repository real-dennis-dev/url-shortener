import { Link } from "react-router-dom";
import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "../components/common/Button";
import { useAuth } from "../contexts/AuthContext";

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started",
      features: [
        { name: "100 links/month", included: true },
        { name: "Basic analytics", included: true },
        { name: "5 custom domains", included: true },
        { name: "24/7 support", included: true },
        { name: "Team collaboration", included: false },
        { name: "API access", included: false },
        { name: "Bulk operations", included: false },
        { name: "Advanced analytics", included: false },
        { name: "Webhook integrations", included: false },
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      description: "For professionals and teams",
      features: [
        { name: "10,000 links/month", included: true },
        { name: "Advanced analytics", included: true },
        { name: "50 custom domains", included: true },
        { name: "Priority support", included: true },
        { name: "Team collaboration", included: true },
        { name: "API access", included: true },
        { name: "Bulk operations", included: true },
        { name: "Webhook integrations", included: true },
        { name: "Advanced analytics", included: true },
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        { name: "Unlimited links", included: true },
        { name: "Enterprise analytics", included: true },
        { name: "Unlimited domains", included: true },
        { name: "Dedicated support", included: true },
        { name: "SSO integration", included: true },
        { name: "Custom contracts", included: true },
        { name: "SLA guarantee", included: true },
        { name: "Advanced security features", included: true },
        { name: "Custom training & onboarding", included: true },
      ],
      cta: "Contact Sales",
      popular: false,
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
            Pricing
          </h1>
          <p className="text-xl text-neutral-500 mt-2 max-w-2xl">
            Choose the plan that fits your needs. Start free and upgrade as you
            grow.
          </p>
        </div>
      </header>

      {/* Pricing Plans */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-xl border ${
                  plan.popular
                    ? "border-primary-500 shadow-xl"
                    : "border-neutral-200"
                } p-8 transition-all duration-300 hover:shadow-lg`}
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
                    <li key={idx} className="flex items-center gap-3 text-sm">
                      {feature.included ? (
                        <CheckIcon className="w-5 h-5 text-success flex-shrink-0" />
                      ) : (
                        <XIcon className="w-5 h-5 text-neutral-300 flex-shrink-0" />
                      )}
                      <span
                        className={
                          feature.included
                            ? "text-neutral-600"
                            : "text-neutral-400"
                        }
                      >
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link to={isAuthenticated ? "/dashboard" : "/register"}>
                  <Button
                    variant={plan.popular ? "primary" : "outline"}
                    fullWidth
                    className={plan.popular ? "shadow-md" : ""}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mt-16 bg-white rounded-xl border border-neutral-200 p-8">
            <h2 className="text-2xl font-bold text-neutral-900 text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-neutral-900 mb-2">
                  Can I change plans later?
                </h4>
                <p className="text-neutral-500 text-sm">
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes will be reflected in your next billing cycle.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 mb-2">
                  What payment methods do you accept?
                </h4>
                <p className="text-neutral-500 text-sm">
                  We accept all major credit cards, PayPal, and bank transfers
                  for enterprise plans.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 mb-2">
                  Is there a free trial?
                </h4>
                <p className="text-neutral-500 text-sm">
                  Yes, all paid plans come with a 14-day free trial. No credit
                  card required to start.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900 mb-2">
                  Can I get a refund?
                </h4>
                <p className="text-neutral-500 text-sm">
                  We offer a 30-day money-back guarantee for all annual plans.
                  Contact our support team for assistance.
                </p>
              </div>
            </div>
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
            Choose the plan that fits your needs and start growing your business
            today.
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
