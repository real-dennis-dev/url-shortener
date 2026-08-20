import { Link } from "react-router-dom";
import { UsersIcon, AwardIcon, GlobeIcon, HeartIcon } from "lucide-react";
import { Button } from "../components/common/Button";

export default function About() {
  const values = [
    {
      icon: <UsersIcon className="w-8 h-8 text-primary-500" />,
      title: "Customer First",
      description:
        "We put our customers at the center of everything we do, building tools that solve real problems.",
    },
    {
      icon: <AwardIcon className="w-8 h-8 text-primary-500" />,
      title: "Excellence",
      description:
        "We strive for excellence in every product we build, ensuring the highest quality and reliability.",
    },
    {
      icon: <GlobeIcon className="w-8 h-8 text-primary-500" />,
      title: "Global Impact",
      description:
        "We're building a global platform that connects people and businesses across the world.",
    },
    {
      icon: <HeartIcon className="w-8 h-8 text-primary-500" />,
      title: "Passion",
      description:
        "We're passionate about what we do and it shows in every feature we build and every customer we serve.",
    },
  ];

  const team = [
    {
      name: "John Doe",
      role: "CEO & Co-founder",
      image:
        "https://ui-avatars.com/api/?name=John+Doe&background=6f4518&color=fff&size=128",
    },
    {
      name: "Jane Smith",
      role: "CTO & Co-founder",
      image:
        "https://ui-avatars.com/api/?name=Jane+Smith&background=6f4518&color=fff&size=128",
    },
    {
      name: "Mike Johnson",
      role: "Head of Product",
      image:
        "https://ui-avatars.com/api/?name=Mike+Johnson&background=6f4518&color=fff&size=128",
    },
    {
      name: "Sarah Wilson",
      role: "Head of Engineering",
      image:
        "https://ui-avatars.com/api/?name=Sarah+Wilson&background=6f4518&color=fff&size=128",
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
            About Us
          </h1>
          <p className="text-xl text-neutral-500 mt-2 max-w-2xl">
            We're on a mission to make link management simple, powerful, and
            accessible to everyone.
          </p>
        </div>
      </header>

      {/* Story */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-xl border border-neutral-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Our Story
            </h2>
            <p className="text-neutral-600 mb-4">
              Founded in 2023, Shortify was born from a simple idea: link
              management shouldn't be complicated. We saw that existing tools
              were either too expensive, too complex, or lacked the features
              that modern businesses need.
            </p>
            <p className="text-neutral-600 mb-4">
              We built Shortify to be the all-in-one solution for link
              management, analytics, and optimization. Our platform serves
              thousands of users across the globe, from individual creators to
              large enterprises.
            </p>
            <p className="text-neutral-600">
              Today, we're proud to be a trusted partner for businesses of all
              sizes, helping them grow their reach and understand their audience
              better.
            </p>
          </div>

          {/* Values */}
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-8">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-neutral-200 p-6"
              >
                <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center mb-4">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-neutral-500 text-sm">{value.description}</p>
              </div>
            ))}
          </div>

          {/* Team */}
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-8">
            Meet the Team
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-neutral-200 p-6 text-center"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                />
                <h3 className="font-semibold text-neutral-900">
                  {member.name}
                </h3>
                <p className="text-sm text-neutral-500">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
