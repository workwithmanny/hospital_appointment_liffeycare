"use client";

import Link from "next/link";
import { Activity, Shield, CheckCircle, Lock, FileText, Mail, Phone, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

const safeguards = [
  {
    icon: Lock,
    title: "Data Encryption",
    description: "All data is encrypted at rest and in transit using AES-256 encryption and TLS 1.3 protocols.",
  },
  {
    icon: Shield,
    title: "Access Controls",
    description: "Role-based access controls ensure only authorized personnel can access patient information.",
  },
  {
    icon: FileText,
    title: "Audit Logging",
    description: "Comprehensive audit logs track all access to protected health information (PHI).",
  },
];

const rights = [
  "Access your medical records",
  "Request corrections to your records",
  "Know who has accessed your information",
  "Request restrictions on information sharing",
  "File a complaint about privacy practices",
  "Receive breach notifications",
];

export default function HipaaCompliancePage() {
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
            <span className="text-label text-brand mb-4 block">Compliance</span>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-text-primary mb-4">HIPAA Compliance</h1>
            <p className="text-text-secondary">Last updated: March 1, 2026</p>
          </div>

          <div className="prose prose-slate max-w-none">
            <div className="bg-brand-light rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-8 h-8 text-brand" />
                <h2 className="text-xl font-semibold text-text-primary m-0">Our Commitment</h2>
              </div>
              <p className="text-text-secondary m-0">LiffeyCare is fully committed to protecting your health information in accordance with the Health Insurance Portability and Accountability Act (HIPAA) and all applicable privacy regulations.</p>
            </div>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">What is HIPAA?</h2>
            <p className="text-text-secondary leading-relaxed mb-6">The Health Insurance Portability and Accountability Act (HIPAA) establishes national standards for protecting sensitive patient health information. It ensures that your medical records and personal health information remain private and secure.</p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">Technical Safeguards</h2>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {safeguards.map((safeguard) => (
                <div key={safeguard.title} className="bg-white rounded-xl border border-border p-4">
                  <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center mb-3">
                    <safeguard.icon className="w-5 h-5 text-brand" />
                  </div>
                  <h3 className="font-semibold text-text-primary text-sm mb-1">{safeguard.title}</h3>
                  <p className="text-xs text-text-secondary">{safeguard.description}</p>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">Your Privacy Rights</h2>
            <p className="text-text-secondary leading-relaxed mb-4">Under HIPAA, you have the following rights regarding your protected health information (PHI):</p>
            <ul className="space-y-3 mb-6">
              {rights.map((right) => (
                <li key={right} className="flex items-start gap-3 text-text-secondary">
                  <CheckCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  {right}
                </li>
              ))}
            </ul>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">Business Associate Agreements</h2>
            <p className="text-text-secondary leading-relaxed mb-6">LiffeyCare enters into Business Associate Agreements (BAAs) with all healthcare providers and partners on our platform. These agreements ensure that all parties handling your PHI are bound by the same strict privacy and security standards.</p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">Breach Notification</h2>
            <p className="text-text-secondary leading-relaxed mb-6">In the unlikely event of a data breach affecting your PHI, we will notify you within 60 days as required by HIPAA. We will provide details about what happened, what information was involved, and what steps we are taking to address the situation.</p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">Training and Compliance</h2>
            <p className="text-text-secondary leading-relaxed mb-6">All LiffeyCare employees undergo regular HIPAA training and certification. Our compliance team monitors our practices continuously to ensure we meet or exceed all regulatory requirements.</p>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">Contact Our Privacy Officer</h2>
            <p className="text-text-secondary leading-relaxed mb-4">For questions about our HIPAA compliance practices or to exercise your privacy rights:</p>
            <div className="bg-surface rounded-xl p-4 mb-6">
              <p className="text-text-secondary text-sm mb-1"><strong>Email:</strong> contact@liffeycare.online</p>
              <p className="text-text-secondary text-sm mb-1"><strong>Phone:</strong> (555) 123-4567</p>
              <p className="text-text-secondary text-sm"><strong>Address:</strong> LiffeyCare Privacy Office, 123 Healthcare Avenue, Dublin, Ireland D02 XY12</p>
            </div>

            <h2 className="text-xl font-semibold text-text-primary mt-8 mb-4">Filing a Complaint</h2>
            <p className="text-text-secondary leading-relaxed mb-6">If you believe your privacy rights have been violated, you may file a complaint with LiffeyCare or with the U.S. Department of Health and Human Services Office for Civil Rights. We will not retaliate against you for filing a complaint.</p>
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
