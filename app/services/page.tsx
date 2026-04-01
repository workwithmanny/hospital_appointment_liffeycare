"use client";

import Link from "next/link";
import {
  Activity,
  Stethoscope,
  Heart,
  Brain,
  Baby,
  Bone,
  Eye,
  Ear,
  Microscope,
  Pill,
  ClipboardList,
  Video,
  MessageSquare,
  FileText,
  Calendar,
  Shield,
  ArrowRight,
  CheckCircle,
  Star,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";

const mainServices = [
  {
    icon: Stethoscope,
    title: "Primary Care",
    description: "Comprehensive health checkups, preventive care, and ongoing management of chronic conditions for your entire family.",
    features: ["Annual physicals", "Vaccinations", "Chronic disease management", "Health screenings"],
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Heart,
    title: "Cardiology",
    description: "Expert heart care including diagnostics, treatment, and preventive strategies for cardiovascular health.",
    features: ["ECG & Echocardiograms", "Stress testing", "Heart rhythm monitoring", "Cardiac rehabilitation"],
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Brain,
    title: "Neurology",
    description: "Specialized care for neurological conditions, from migraines to complex disorders affecting the brain and nervous system.",
    features: ["Neurological exams", " EEG testing", "Headache management", "Stroke prevention"],
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: Baby,
    title: "Pediatrics",
    description: "Gentle, comprehensive care for infants, children, and adolescents, focusing on growth, development, and wellness.",
    features: ["Well-child visits", "Immunizations", "Developmental assessments", "Adolescent medicine"],
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Bone,
    title: "Orthopedics",
    description: "Expert treatment for musculoskeletal conditions, from sports injuries to joint replacement and rehabilitation.",
    features: ["Joint replacement", "Sports medicine", "Fracture care", "Physical therapy"],
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Eye,
    title: "Ophthalmology",
    description: "Complete eye care services including vision correction, disease treatment, and surgical procedures.",
    features: ["Eye exams", "Cataract surgery", "Glaucoma treatment", "LASIK consultation"],
    color: "bg-emerald-50 text-emerald-600",
  },
];

const additionalServices = [
  {
    icon: Ear,
    title: "ENT (Otolaryngology)",
    description: "Care for ear, nose, and throat conditions",
  },
  {
    icon: Microscope,
    title: "Laboratory Services",
    description: "On-site lab testing with fast, accurate results",
  },
  {
    icon: Pill,
    title: "Pharmacy",
    description: "Convenient prescription services and medication counseling",
  },
  {
    icon: ClipboardList,
    title: "Diagnostics & Imaging",
    description: "X-rays, MRI, CT scans, and ultrasound services",
  },
];

const virtualServices = [
  {
    icon: Video,
    title: "Video Consultations",
    description: "Face-to-face appointments with your doctor from the comfort of your home. Perfect for follow-ups, medication reviews, and minor concerns.",
  },
  {
    icon: MessageSquare,
    title: "Secure Messaging",
    description: "Send and receive messages with your healthcare team anytime. Get answers to questions without scheduling an appointment.",
  },
  {
    icon: FileText,
    title: "Digital Prescriptions",
    description: "Receive prescriptions electronically and send them directly to your preferred pharmacy for pickup or delivery.",
  },
  {
    icon: Calendar,
    title: "Online Scheduling",
    description: "Book, reschedule, or cancel appointments instantly through our patient portal, available 24/7.",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up in minutes and complete your health profile",
  },
  {
    number: "02",
    title: "Find Your Doctor",
    description: "Browse our network of verified healthcare providers",
  },
  {
    number: "03",
    title: "Book Instantly",
    description: "See real-time availability and schedule your visit",
  },
  {
    number: "04",
    title: "Receive Care",
    description: "Attend your appointment in-person or virtually",
  },
];

export default function ServicesPage() {
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
              <Link href="/services" className="text-sm font-medium text-brand transition-colors">
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
              <Stethoscope className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-brand">Our Services</span>
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-6">
              Comprehensive care for{" "}
              <span className="text-brand">every need</span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              From routine checkups to specialized treatments, we offer a full spectrum 
              of healthcare services designed to keep you and your family healthy.
            </p>
          </div>
        </div>
      </section>

      {/* Main Services Grid */}
      <section className="py-16 sm:py-20 lg:py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-label text-brand mb-4 block">Medical Specialties</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-4">
              Expert care across all specialties
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Our network includes board-certified specialists in every major field of medicine.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainServices.map((service) => (
              <div
                key={service.title}
                className="group bg-white rounded-2xl border border-border p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center mb-4`}>
                  <service.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{service.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle className="w-4 h-4 text-brand shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-label text-brand mb-4 block">Support Services</span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight mb-4">
              Everything you need under one roof
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalServices.map((service) => (
              <div
                key={service.title}
                className="bg-surface rounded-2xl border border-border p-6 hover:border-brand/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center mb-4">
                  <service.icon className="w-5 h-5 text-brand" />
                </div>
                <h3 className="font-semibold text-text-primary mb-1">{service.title}</h3>
                <p className="text-sm text-text-secondary">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Virtual Care Section */}
      <section className="py-16 sm:py-20 lg:py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-label text-brand mb-4 block">Virtual Care</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-6">
                Healthcare at your fingertips
              </h2>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-8">
                Access quality care from anywhere with our comprehensive virtual health 
                services. Perfect for busy schedules, minor concerns, or when you just 
                can't make it to the office.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {virtualServices.map((service) => (
                  <div key={service.title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                      <service.icon className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary text-sm mb-1">{service.title}</h3>
                      <p className="text-xs text-text-secondary">{service.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-brand" />
                  <span className="text-sm text-text-secondary">HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-brand" />
                  <span className="text-sm text-text-secondary">256-bit Encryption</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80"
                  alt="Virtual consultation"
                  className="w-full h-[400px] sm:h-[500px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-lg p-4 sm:p-6 max-w-xs hidden sm:block">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Video className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Video Visit</p>
                    <p className="text-sm text-text-secondary">Ready in 2 minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm text-text-secondary ml-2">4.9/5 rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-label text-brand mb-4 block">How It Works</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-4">
              Simple, seamless care
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Getting the care you need has never been easier
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step) => (
              <div key={step.number} className="relative">
                <div className="text-6xl font-bold text-brand/10 mb-4">{step.number}</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary">{step.description}</p>
              </div>
            ))}
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
                  Book Your First Visit
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/doctors"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  Browse Doctors
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
