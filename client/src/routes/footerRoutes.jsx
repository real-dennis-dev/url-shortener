import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// Lazy load footer pages
const Features = lazy(() => import("../pages/Features"));
const Pricing = lazy(() => import("../pages/Pricing"));
const Integrations = lazy(() => import("../pages/Integrations"));
const ApiDocs = lazy(() => import("../pages/ApiDocs"));
const About = lazy(() => import("../pages/About"));
const Blog = lazy(() => import("../pages/Blog"));
const Careers = lazy(() => import("../pages/Careers"));
const Contact = lazy(() => import("../pages/Contact"));
const Privacy = lazy(() => import("../pages/Privacy"));
const Terms = lazy(() => import("../pages/Terms"));
const Cookies = lazy(() => import("../pages/Cookies"));
const Gdpr = lazy(() => import("../pages/Gdpr"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
  </div>
);

/**
 * Footer Pages Routes
 * Public pages accessible from footer
 */
export default function FooterRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="features" element={<Features />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="integrations" element={<Integrations />} />
        <Route path="api-docs" element={<ApiDocs />} />
        <Route path="about" element={<About />} />
        <Route path="blog" element={<Blog />} />
        <Route path="careers" element={<Careers />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="cookies" element={<Cookies />} />
        <Route path="gdpr" element={<Gdpr />} />
      </Routes>
    </Suspense>
  );
}

// Optional: keep the array export if you still need it elsewhere
export const footerRoutes = [
  { path: "features", title: "Features" },
  { path: "pricing", title: "Pricing" },
  { path: "integrations", title: "Integrations" },
  { path: "api-docs", title: "API Docs" },
  { path: "about", title: "About" },
  { path: "blog", title: "Blog" },
  { path: "careers", title: "Careers" },
  { path: "contact", title: "Contact" },
  { path: "privacy", title: "Privacy" },
  { path: "terms", title: "Terms" },
  { path: "cookies", title: "Cookies" },
  { path: "gdpr", title: "GDPR" },
];
