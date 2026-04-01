"use client";

import Link from "next/link";
import { Activity, Mail, Phone, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export default function PrivacyPolicyPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

      {/* Content */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <span className="text-label text-brand mb-4 block">Legal</span>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-text-primary mb-4">
              Privacy Policy
            </h1>
            <p className="text-text-secondary">
              Last updated: March 1, 2026
            </p>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-text-secondary leading-relaxed mb-6">
              At LiffeyCare, we take your privacy seriously. This Privacy Policy describes how we collect, 
              use, store, and protect your personal information when you use our services.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-6 ml-4">
              <li>Personal identification information (name, email, phone number, address)</li>
              <li>Health and medical information relevant to your care</li>
              <li>Insurance and payment information</li>
              <li>Appointment history and preferences</li>
              <li>Communications with healthcare providers through our platform</li>
            </ul>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-6 ml-4">
              <li>Provide healthcare services and facilitate appointments</li>
              <li>Process payments and insurance claims</li>
              <li>Communicate with you about your care</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Send you updates and promotional materials (with your consent)</li>
            </ul>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">3. Information Sharing</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              We do not sell your personal information. We only share your information with:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-6 ml-4">
              <li>Your healthcare providers to facilitate your care</li>
              <li>Insurance companies for claims processing</li>
              <li>Service providers who assist in operating our platform</li>
              <li>Legal authorities when required by law</li>
            </ul>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">4. Data Security</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              We implement industry-standard security measures to protect your information, including 
              encryption, access controls, and regular security audits. All data is stored in compliance 
              with HIPAA regulations.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">5. Your Rights</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-6 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data (subject to legal requirements)</li>
              <li>Opt-out of marketing communications</li>
              <li>Request a copy of your data</li>
            </ul>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">6. Cookies and Tracking</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              We use cookies and similar technologies to improve your experience on our platform. 
              You can manage your cookie preferences through your browser settings.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">7. Children's Privacy</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              Our services are not intended for children under 13. We do not knowingly collect 
              information from children under 13 without parental consent.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">8. Changes to This Policy</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              We may update this Privacy Policy from time to time. We will notify you of any 
              significant changes by posting the new policy on our website and updating the 
              effective date.
            </p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">9. Contact Us</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-text-secondary leading-relaxed">
              <strong>Email:</strong> contact@liffeycare.online<br />
              <strong>Address:</strong> 123 Healthcare Avenue, Dublin, Ireland D02 XY12<br />
              <strong>Phone:</strong> (555) 123-4567
            </p>
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
