"use client";

import Link from "next/link";
import { Activity, Mail, Phone, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export default function TermsOfServicePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-base">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-lg shadow-sm border-b border-border" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center transition-transform group-hover:scale-105">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-semibold text-lg text-text-primary">LiffeyCare</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/services" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Services</Link>
              <Link href="/doctors" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Doctors</Link>
              <Link href="/about" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">About</Link>
              <Link href="/contact" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Contact</Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="hidden sm:inline-flex text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-4 py-2">Sign In</Link>
              <Link href="/auth/signup" className="btn-primary">Get Started</Link>
            </div>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <span className="text-label text-brand mb-4 block">Legal</span>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-text-primary mb-4">Terms of Service</h1>
            <p className="text-text-secondary">Last updated: March 1, 2026</p>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-text-secondary leading-relaxed mb-6">Please read these Terms of Service carefully before using the LiffeyCare platform. By accessing or using our services, you agree to be bound by these terms.</p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-text-secondary leading-relaxed mb-6">By creating an account or using LiffeyCare services, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use our services.</p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">2. Description of Services</h2>
            <p className="text-text-secondary leading-relaxed mb-6">LiffeyCare provides a platform connecting patients with healthcare providers. We facilitate appointment scheduling, telehealth consultations, messaging, and health record management. LiffeyCare is not a healthcare provider and does not provide medical advice.</p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">3. User Accounts</h2>
            <p className="text-text-secondary leading-relaxed mb-4">To use our services, you must:</p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-6 ml-4">
              <li>Be at least 18 years old or have parental consent</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">4. Medical Disclaimer</h2>
            <p className="text-text-secondary leading-relaxed mb-6">LiffeyCare is a technology platform, not a medical service. Healthcare providers on our platform are independent professionals. Always seek emergency care for life-threatening conditions. Call 911 or your local emergency number for emergencies.</p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">5. Payments and Fees</h2>
            <p className="text-text-secondary leading-relaxed mb-6">You agree to pay all fees associated with services booked through our platform. Fees are displayed before confirmation. Insurance coverage is verified but final determination is made by your insurer. Cancellation policies vary by provider.</p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">6. Prohibited Activities</h2>
            <p className="text-text-secondary leading-relaxed mb-4">Users may not:</p>
            <ul className="list-disc list-inside text-text-secondary space-y-2 mb-6 ml-4">
              <li>Use the platform for any illegal purpose</li>
              <li>Harass, abuse, or harm others</li>
              <li>Interfere with platform security or functionality</li>
              <li>Share account credentials with others</li>
              <li>Submit false or misleading information</li>
            </ul>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">7. Limitation of Liability</h2>
            <p className="text-text-secondary leading-relaxed mb-6">LiffeyCare is not liable for medical decisions, outcomes, or advice provided by healthcare providers. Our liability is limited to the amount paid for services through our platform in the 12 months preceding any claim.</p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">8. Termination</h2>
            <p className="text-text-secondary leading-relaxed mb-6">We may suspend or terminate your account for violations of these terms. You may delete your account at any time. Certain provisions survive termination.</p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">9. Changes to Terms</h2>
            <p className="text-text-secondary leading-relaxed mb-6">We may update these terms from time to time. We will notify you of significant changes. Continued use after changes constitutes acceptance.</p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">10. Contact Us</h2>
            <p className="text-text-secondary leading-relaxed">For questions about these Terms, contact contact@liffeycare.online or (555) 123-4567.</p>
          </div>
        </div>
      </section>

      <footer className="bg-text-primary pt-12 sm:pt-16 lg:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-12">
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center"><Activity className="w-5 h-5 text-white" /></div>
                <span className="font-display font-semibold text-lg text-white">LiffeyCare</span>
              </Link>
              <p className="text-text-tertiary text-sm mb-6">Modern healthcare designed around you.</p>
              <div className="flex gap-3">
                <a href="mailto:contact@liffeycare.online" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-text-tertiary hover:bg-white/20 hover:text-white transition-colors"><Mail className="w-5 h-5" /></a>
                <a href="tel:+15551234567" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-text-tertiary hover:bg-white/20 hover:text-white transition-colors"><Phone className="w-5 h-5" /></a>
                <Link href="/contact" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-text-tertiary hover:bg-white/20 hover:text-white transition-colors"><MapPin className="w-5 h-5" /></Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Patients</h4>
              <ul className="space-y-3">
                <li><Link href="/doctors" className="text-sm text-text-tertiary hover:text-white transition-colors">Find a Doctor</Link></li>
                <li><Link href="/doctors" className="text-sm text-text-tertiary hover:text-white transition-colors">Book Appointment</Link></li>
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
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="/privacy-policy" className="text-sm text-text-tertiary hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="text-sm text-text-tertiary hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/hipaa-compliance" className="text-sm text-text-tertiary hover:text-white transition-colors">HIPAA Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-text-tertiary">2026 LiffeyCare. All rights reserved.</p>
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
