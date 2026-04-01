"use client";

import Link from "next/link";
import {
  Activity,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

const contactMethods = [
  {
    icon: Phone,
    title: "Phone",
    value: "(555) 123-4567",
    description: "Mon-Fri 8am-8pm, Sat-Sun 9am-5pm",
    href: "tel:+15551234567",
  },
  {
    icon: Mail,
    title: "Email",
    value: "contact@liffeycare.online",
    description: "We respond within 24 hours",
    href: "mailto:contact@liffeycare.online",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "123 Healthcare Ave, Dublin",
    description: "Visit our headquarters",
    href: "#",
  },
  {
    icon: Clock,
    title: "Support Hours",
    value: "24/7 Online Support",
    description: "Always here when you need us",
    href: "/auth/login",
  },
];

const faqs = [
  {
    question: "How do I book an appointment?",
    answer: "You can book an appointment through our website by clicking 'Book Appointment' on the homepage, or by calling our support line. Simply create an account, browse available doctors, and select a time that works for you.",
  },
  {
    question: "What insurance plans do you accept?",
    answer: "We accept most major insurance plans including Blue Cross, Aetna, Cigna, and Medicare. Visit our Insurance page for a complete list of accepted providers.",
  },
  {
    question: "Can I message my doctor directly?",
    answer: "Yes! Once you've had an appointment with a doctor, you can message them directly through our secure patient portal for follow-up questions and concerns.",
  },
  {
    question: "How do I access my medical records?",
    answer: "Your medical records are available 24/7 through the patient portal. Simply log in and navigate to the 'Health Records' section to view your complete history.",
  },
];

export default function ContactPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setIsSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "", category: "general" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Link href="/contact" className="text-sm font-medium text-brand transition-colors">
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
              <MessageCircle className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-brand">Get in Touch</span>
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-6">
              We'd love to hear from{" "}
              <span className="text-brand">you</span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Have a question, feedback, or just want to say hello? Our team is here 
              to help. Reach out and we'll get back to you as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 border-y border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method) => (
              <a
                key={method.title}
                href={method.href}
                className="group p-6 bg-white rounded-2xl border border-border hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center mb-4 transition-colors group-hover:bg-brand">
                  <method.icon className="w-6 h-6 text-brand transition-colors group-hover:text-white" />
                </div>
                <h3 className="font-semibold text-text-primary mb-1">{method.title}</h3>
                <p className="text-brand font-medium text-sm mb-1">{method.value}</p>
                <p className="text-sm text-text-secondary">{method.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Form */}
            <div>
              <span className="text-label text-brand mb-4 block">Send a Message</span>
              <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight mb-6">
                Fill out the form below
              </h2>
              <p className="text-text-secondary mb-8">
                We'll get back to you within 24 hours. For urgent medical concerns, 
                please call our support line directly.
              </p>

              {isSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">Message Sent!</h3>
                  <p className="text-text-secondary">Thank you for reaching out. We'll be in touch soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input"
                        placeholder="John Doe"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input"
                        placeholder="john@example.com"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Subject</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => {
                        const category = e.target.value;
                        const subjectMap: Record<string, string> = {
                          general: "General Inquiry",
                          appointment: "Appointment Help",
                          billing: "Billing Question",
                          technical: "Technical Support",
                          feedback: "Feedback",
                          partnership: "Partnership",
                        };
                        setFormData({ ...formData, category, subject: subjectMap[category] || category });
                      }}
                      className="input"
                      disabled={isSubmitting}
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="appointment">Appointment Help</option>
                      <option value="billing">Billing Question</option>
                      <option value="technical">Technical Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="input resize-none"
                      placeholder="How can we help you?"
                      disabled={isSubmitting}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn-primary w-full inline-flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* FAQ */}
            <div>
              <span className="text-label text-brand mb-4 block">FAQ</span>
              <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight mb-6">
                Frequently asked questions
              </h2>
              <p className="text-text-secondary mb-8">
                Find quick answers to common questions. Can't find what you're looking for? 
                Feel free to contact us directly.
              </p>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-2xl overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-surface transition-colors"
                    >
                      <span className="font-medium text-text-primary pr-4">{faq.question}</span>
                      <span className={`transform transition-transform ${openFaq === index ? "rotate-180" : ""}`}>
                        <ArrowRight className="w-5 h-5 text-text-secondary rotate-90" />
                      </span>
                    </button>
                    {openFaq === index && (
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                        <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 sm:py-20 lg:py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-label text-brand mb-4 block">Visit Us</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-4">
              Our headquarters
            </h2>
            <p className="text-text-secondary">
              Stop by our office to meet the team in person. We're located in the heart of Dublin.
            </p>
          </div>

          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-white">
            <div className="aspect-[21/9] bg-gradient-to-br from-brand-light to-brand-muted/30 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-brand mx-auto mb-4" />
                <p className="text-lg font-semibold text-text-primary">123 Healthcare Avenue</p>
                <p className="text-text-secondary">Dublin, Ireland D02 XY12</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-32 px-4 sm:px-0">
        <div className="max-w-7xl mx-auto sm:px-4 lg:px-8">
          <div className="relative bg-brand rounded-2xl sm:rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand to-brand-hover" />
            <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/5 rounded-full blur-2xl" />

            <div className="relative px-6 py-12 sm:px-8 sm:py-16 lg:px-16 lg:py-20 text-center">
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-brand-light text-base sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8">
                Join thousands of patients who trust LiffeyCare for their healthcare needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white text-brand font-semibold rounded-xl hover:bg-white/90 transition-colors"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/doctors"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  Find a Doctor
                </Link>
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
