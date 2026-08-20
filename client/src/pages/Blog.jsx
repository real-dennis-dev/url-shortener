import { Link } from "react-router-dom";
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Button } from "../components/common/Button";

export default function Blog() {
  const posts = [
    {
      id: 1,
      title: "How to Optimize Your Short Links for Maximum Click-Through Rate",
      excerpt:
        "Learn proven strategies to increase engagement and conversions with your shortened URLs.",
      author: "John Doe",
      date: "2024-01-15",
      readTime: "5 min read",
      category: "Tips & Tricks",
      image:
        "https://images.unsplash.com/photo-1432889821006-3d8c0b4fe2ff?w=800&h=400&fit=crop",
    },
    {
      id: 2,
      title: "The Future of Link Management: AI and Automation",
      excerpt:
        "Discover how artificial intelligence is transforming the way we manage and track links.",
      author: "Jane Smith",
      date: "2024-01-10",
      readTime: "7 min read",
      category: "Technology",
      image:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop",
    },
    {
      id: 3,
      title: "Building Brand Trust with Custom Short Domains",
      excerpt:
        "Why using your own domain for short links builds credibility and trust with your audience.",
      author: "Mike Johnson",
      date: "2024-01-05",
      readTime: "4 min read",
      category: "Branding",
      image:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop",
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
            Blog
          </h1>
          <p className="text-xl text-neutral-500 mt-2 max-w-2xl">
            Insights, tips, and updates from the Shortify team.
          </p>
        </div>
      </header>

      {/* Blog Posts */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-neutral-500 mb-3">
                    <span className="bg-accent-100 text-primary-600 px-2 py-1 rounded text-xs font-medium">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-neutral-500 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-neutral-400 mb-4">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" />
                      {post.readTime}
                    </span>
                  </div>
                  <Link to={`/blog/${post.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary-500"
                    >
                      Read More
                      <ArrowRightIcon className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-16 px-4 bg-primary-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Subscribe to Our Newsletter
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Get the latest posts, tips, and updates delivered straight to your
            inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <Button
              variant="success"
              className="bg-white text-primary-600 hover:bg-neutral-100 whitespace-nowrap"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
