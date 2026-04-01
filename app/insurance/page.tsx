"use client";

import Link from "next/link";
import {
  Activity,
  Shield,
  CheckCircle,
  HelpCircle,
  FileText,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Heart,
  Stethoscope,
  Pill,
  Eye,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

const insuranceProviders = [
  { name: "Blue Cross Blue Shield", logo: "BCBS" },
  { name: "Aetna", logo: "AET" },
  { name: "Cigna", logo: "CIG" },
  { name: "UnitedHealthcare", logo: "UHC" },
  { name: "Humana", logo: "HUM" },
  { name: "Medicare", logo: "MED" },
  { name: "Medicaid", logo: "MCA" },
  { name: "Kaiser Permanente", logo: "KP" },
  { name: "Anthem", logo: "ANT" },
  { name: "Oxford", logo: "OXF" },
  { name: "EmblemHealth", logo: "EMB" },
  { name: "HealthFirst", logo: "HF" },
];

const services = [
  {
    icon: Stethoscope,
    title: "Primary Care",
    description: "Annual physicals, checkups, preventive care",
  },
  {
    icon: Heart,
    title: "Specialist Visits",
    description: "Cardiology, neurology, orthopedics, and more",
  },
  {
    icon: Pill,
    title: "Prescriptions",
    description: "Medication coverage and pharmacy services",
  },
  {
    icon: Eye,
    title: "Vision Care",
    description: "Eye exams, glasses, and contact lenses",
  },
  {
    icon: Shield,
    title: "Mental Health",
    description: "Therapy, counseling, and psychiatric care",
  },
  {
    icon: Sparkles,
    title: "Preventive Care",
    description: "Vaccinations, screenings, and wellness visits",
  },
];

const faqs = [
  {
    question: "How do I know if my insurance is accepted?",
    answer: "We accept most major insurance plans. You can verify your coverage by calling our support team or checking with your insurance provider. When you book an appointment, we'll also verify your benefits.",
  },
  {
    question: "What if I don't have insurance?",
    answer: "We offer competitive self-pay rates for all services. Many of our primary care visits start at $75, and we offer payment plans for larger expenses. Contact us to discuss your options.",
  },
  {
    question: "Do you accept HSA and FSA cards?",
    answer: "Yes! We accept Health Savings Account (HSA) and Flexible Spending Account (FSA) cards for all eligible medical expenses. You can use these cards just like a regular credit or debit card.",
  },
  {
    question: "Will I be charged for no-shows?",
    answer: "We understand that plans change. You can cancel or reschedule up to 24 hours before your appointment at no charge. Cancellations within 24 hours may be subject to a fee.",
  },
];

const steps = [
  {
    number: "1",
    title: "Verify Coverage",
    description: "Enter your insurance info when booking",
  },
  {
    number: "2",
    title: "Book Appointment",
    description: "See your estimated costs upfront",
  },
  {
    number: "3",
    title: "Receive Care",
    description: "We handle the insurance paperwork",
  },
  {
    number: "4",
    title: "Pay Remainder",
    description: "Only pay what's not covered",
  },
];

export default function InsurancePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-brand/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-muted/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-light border border-brand/20 px-4 py-2 mb-6">
              <Shield className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-brand">Insurance</span>
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-6">
              We accept most major{" "}
              <span className="text-brand">insurance plans</span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Getting the care you need should never be complicated. We work with 
              most insurance providers to make your healthcare experience seamless.
            </p>
          </div>
        </div>
      </section>

      {/* Insurance Providers */}
      <section className="py-12 border-y border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-text-secondary mb-8">
            Trusted by leading insurance providers
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {insuranceProviders.map((provider) => (
              <div
                key={provider.name}
                className="bg-white rounded-xl border border-border p-4 flex items-center justify-center h-20"
              >
                <span className="text-sm font-semibold text-text-secondary">{provider.logo}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-text-tertiary mt-6">
            Don't see your provider? Contact us to verify coverage.
          </p>
        </div>
      </section>

      {/* Covered Services */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-label text-brand mb-4 block">Coverage</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-4">
              What's covered
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Most insurance plans cover a wide range of services through LiffeyCare
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="feature-card group p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center mb-4 transition-colors group-hover:bg-brand">
                  <service.icon className="w-6 h-6 text-brand transition-colors group-hover:text-white" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-1">{service.title}</h3>
                <p className="text-sm text-text-secondary">{service.description}</p>
                <div className="mt-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-text-secondary">Usually covered</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 lg:py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-label text-brand mb-4 block">Simple Process</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-4">
              How insurance works with us
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="bg-white rounded-2xl border border-border p-6">
                <div className="w-10 h-10 rounded-full bg-brand text-white flex items-center justify-center font-semibold mb-4">
                  {step.number}
                </div>
                <h3 className="font-semibold text-text-primary mb-1">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-label text-brand mb-4 block">FAQ</span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight mb-4">
              Common insurance questions
            </h2>
          </div>

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
                  <HelpCircle className={`w-5 h-5 text-text-secondary shrink-0 transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
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
      </section>

      {/* Cost Estimator CTA */}
      <section className="py-16 sm:py-20 lg:py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-label text-brand mb-4 block">Transparent Pricing</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-6">
                Know your costs upfront
              </h2>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-6">
                No surprises, no hidden fees. Before you book any appointment, 
                you'll see a clear estimate of what you'll pay out-of-pocket 
                based on your insurance coverage.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  "Instant cost estimates",
                  "Insurance benefits verification",
                  "Clear breakdown of coverage",
                  "Flexible payment options",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-text-secondary">
                    <CheckCircle className="w-5 h-5 text-brand shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/doctors" className="btn-primary inline-flex items-center gap-2">
                Check Your Costs
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center">
                    <FileText className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Cost Estimate Example</p>
                    <p className="text-sm text-text-secondary">Primary Care Visit</p>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Visit Cost</span>
                    <span className="font-medium text-text-primary">$150.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Insurance Coverage</span>
                    <span className="font-medium text-green-600">-$120.00</span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-text-primary">Your Cost</span>
                      <span className="font-semibold text-brand">$30.00</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-text-tertiary">
                  *Actual costs may vary based on your specific insurance plan
                </p>
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
                Still have questions?
              </h2>
              <p className="text-brand-light text-base sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8">
                Our team is here to help you understand your coverage and find the best care options.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <a
                  href="mailto:contact@liffeycare.online"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white text-brand font-semibold rounded-xl hover:bg-white/90 transition-colors"
                >
                  Contact Insurance Support
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  General Contact
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
