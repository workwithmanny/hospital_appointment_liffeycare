"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Calendar,
  Clock,
  User,
  Tag,
  Search,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";

const blogPosts = [
  {
    id: 1,
    title: "The Future of Telemedicine: What Patients Need to Know",
    excerpt: "Virtual healthcare is transforming how we access medical services. Learn how telemedicine works and what it means for your healthcare journey.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80",
    category: "Technology",
    author: "Dr. Amanda Chen",
    date: "Mar 28, 2026",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "10 Tips for Managing Seasonal Allergies",
    excerpt: "Spring is here, and so are seasonal allergies. Discover expert tips for minimizing symptoms and enjoying the season symptom-free.",
    image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=600&q=80",
    category: "Wellness",
    author: "Dr. Sarah Mitchell",
    date: "Mar 25, 2026",
    readTime: "4 min read",
  },
  {
    id: 3,
    title: "Understanding Your Blood Test Results",
    excerpt: "Blood tests can reveal a lot about your health. We break down common blood panels and what your results actually mean.",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
    category: "Health Education",
    author: "Dr. James Wilson",
    date: "Mar 22, 2026",
    readTime: "7 min read",
  },
  {
    id: 4,
    title: "Mental Health Awareness: Breaking the Stigma",
    excerpt: "Mental health is just as important as physical health. Learn about common conditions and when to seek professional help.",
    image: "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=600&q=80",
    category: "Mental Health",
    author: "Dr. Emily Okonkwo",
    date: "Mar 18, 2026",
    readTime: "6 min read",
  },
  {
    id: 5,
    title: "Heart-Healthy Eating: A Complete Guide",
    excerpt: "Your diet plays a crucial role in cardiovascular health. Discover the best foods for maintaining a healthy heart.",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=80",
    category: "Nutrition",
    author: "Dr. Raj Patel",
    date: "Mar 15, 2026",
    readTime: "5 min read",
  },
  {
    id: 6,
    title: "The Importance of Regular Health Screenings",
    excerpt: "Preventive care is key to long-term health. Find out which screenings you need and when to schedule them.",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80",
    category: "Prevention",
    author: "Dr. Amanda Chen",
    date: "Mar 12, 2026",
    readTime: "4 min read",
  },
];

const categories = [
  "All",
  "Technology",
  "Wellness",
  "Health Education",
  "Mental Health",
  "Nutrition",
  "Prevention",
];

const featuredPost = {
  title: "How AI is Revolutionizing Healthcare Diagnostics",
  excerpt: "Artificial intelligence is transforming how doctors diagnose diseases, from early cancer detection to predicting heart attacks. Discover how this technology is improving patient outcomes and what it means for the future of medicine.",
  image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=1200&q=80",
  category: "Technology",
  author: "Dr. James Wilson",
  date: "Mar 30, 2026",
  readTime: "8 min read",
};

export default function BlogPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-base">
      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 backdrop-blur-lg shadow-sm border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center transition-transform group-hover:scale-105">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-semibold text-lg text-text-primary">
                LiffeyCare
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="/services" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Services
              </Link>
              <Link href="/doctors" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Doctors
              </Link>
              <Link href="/about" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                Contact
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="hidden sm:inline-flex text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-4 py-2">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-brand/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-muted/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-light border border-brand/20 px-4 py-2 mb-6">
              <Tag className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-brand">Health Blog</span>
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-6">
              Insights for better{" "}
              <span className="text-brand">health</span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Expert advice, health tips, and the latest in medical innovation 
              from our team of healthcare professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 border-y border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-label text-brand mb-6 block">Featured Article</span>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                className="w-full h-[300px] sm:h-[400px] object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-medium text-white">
                  {featuredPost.category}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {featuredPost.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {featuredPost.readTime}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-4">
                {featuredPost.title}
              </h2>
              <p className="text-text-secondary leading-relaxed mb-6">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center">
                    <User className="w-5 h-5 text-brand" />
                  </div>
                  <span className="text-sm font-medium text-text-primary">{featuredPost.author}</span>
                </div>
                <button className="btn-primary inline-flex items-center gap-2">
                  Read Article
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? "bg-brand text-white"
                      : "bg-surface text-text-secondary hover:bg-border"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl border border-border bg-white text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-text-primary">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs text-text-secondary mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-brand transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-light flex items-center justify-center">
                      <User className="w-3 h-3 text-brand" />
                    </div>
                    <span className="text-xs text-text-secondary">{post.author}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-secondary">No articles found matching your criteria.</p>
            </div>
          )}

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="btn-secondary inline-flex items-center gap-2">
              Load More Articles
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 sm:py-20 lg:py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-brand rounded-2xl sm:rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand-hover" />
            <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/5 rounded-full blur-2xl" />

            <div className="relative px-6 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-20">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white mb-4">
                  Stay informed with our newsletter
                </h2>
                <p className="text-brand-light mb-8">
                  Get the latest health tips and medical insights delivered straight to your inbox.
                </p>
                <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/60 outline-none focus:bg-white/20 transition-colors"
                  />
                  <button type="submit" className="px-6 py-3 bg-white text-brand font-semibold rounded-xl hover:bg-white/90 transition-colors whitespace-nowrap">
                    Subscribe
                  </button>
                </form>
                <p className="text-brand-light text-sm mt-4">
                  No spam, unsubscribe anytime. Read our <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-text-primary pt-12 sm:pt-16 lg:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-12">
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-semibold text-lg text-white">
                  LiffeyCare
                </span>
              </Link>
              <p className="text-text-tertiary text-sm mb-6">
                Modern healthcare designed around you. Your health journey starts here.
              </p>
              <div className="flex gap-3">
                <a href="mailto:contact@liffeycare.online" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-text-tertiary hover:bg-white/20 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
                <a href="tel:+15551234567" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-text-tertiary hover:bg-white/20 hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
                <Link href="/contact" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-text-tertiary hover:bg-white/20 hover:text-white transition-colors">
                  <MapPin className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Patients</h4>
              <ul className="space-y-3">
                <li><Link href="/doctors" className="text-sm text-text-tertiary hover:text-white transition-colors">Find a Doctor</Link></li>
                <li><Link href="/doctors" className="text-sm text-text-tertiary hover:text-white transition-colors">Book Appointment</Link></li>
                <li><Link href="/auth/login" className="text-sm text-text-tertiary hover:text-white transition-colors">Patient Portal</Link></li>
                <li><Link href="/insurance" className="text-sm text-text-tertiary hover:text-white transition-colors">Insurance</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-sm text-text-tertiary hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/careers" className="text-sm text-text-tertiary hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="text-sm text-text-tertiary hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/blog" className="text-sm text-text-tertiary hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Providers</h4>
              <ul className="space-y-3">
                <li><Link href="/auth/login" className="text-sm text-text-tertiary hover:text-white transition-colors">Doctor Login</Link></li>
                <li><Link href="/auth/login/admin" className="text-sm text-text-tertiary hover:text-white transition-colors">Admin Login</Link></li>
                <li><Link href="/careers" className="text-sm text-text-tertiary hover:text-white transition-colors">Join Network</Link></li>
                <li><Link href="/services" className="text-sm text-text-tertiary hover:text-white transition-colors">Resources</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-text-tertiary">
                2026 LiffeyCare. All rights reserved.
              </p>
              <div className="flex flex-wrap gap-6 text-sm justify-center">
                <Link href="/privacy-policy" className="text-text-tertiary hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms-of-service" className="text-text-tertiary hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/hipaa-compliance" className="text-text-tertiary hover:text-white transition-colors">HIPAA Compliance</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
