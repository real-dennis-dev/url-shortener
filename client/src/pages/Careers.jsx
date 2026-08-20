import { Link } from "react-router-dom";
import {
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Button } from "../components/common/Button";

export default function Careers() {
  const positions = [
    {
      title: "Senior Full Stack Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      description:
        "Build and scale our link management platform with modern technologies.",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "San Francisco, CA",
      type: "Full-time",
      description: "Design beautiful and intuitive experiences for our users.",
    },
    {
      title: "Marketing Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
      description:
        "Lead our marketing efforts and grow our user base globally.",
    },
    {
      title: "Customer Success Specialist",
      department: "Support",
      location: "Remote",
      type: "Full-time",
      description: "Help our customers succeed with our platform.",
    },
  ];

  const benefits = [
    "Competitive salary and equity",
    "Health, dental, and vision insurance",
    "Flexible work hours",
    "Remote-first culture",
    "Professional development budget",
    "Home office stipend",
    "Paid time off and holidays",
    "Team retreats and events",
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
            Careers
          </h1>
          <p className="text-xl text-neutral-500 mt-2 max-w-2xl">
            Join our team and help us build the future of link management.
          </p>
        </div>
      </header>

      {/* Why Join */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-white rounded-xl border border-neutral-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Why Join Shortify?
            </h2>
            <p className="text-neutral-600 mb-6">
              We're building a platform that helps millions of users manage
              their links effectively. We believe in working hard, having fun,
              and making a real impact.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-sm text-neutral-600"
                >
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full flex-shrink-0" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          {/* Open Positions */}
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Open Positions
          </h2>
          <div className="space-y-4">
            {positions.map((position, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900">
                      {position.title}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <BriefcaseIcon className="w-4 h-4" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {position.type}
                      </span>
                    </div>
                    <p className="text-neutral-500 text-sm mt-2">
                      {position.description}
                    </p>
                  </div>
                  <Button variant="primary" size="sm" className="flex-shrink-0">
                    Apply Now
                    <ArrowRightIcon className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-neutral-500 text-sm">
              Don't see a position that fits? Send us your resume at{" "}
              <a
                href="mailto:careers@shortify.io"
                className="text-primary-500 hover:underline"
              >
                careers@shortify.io
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
