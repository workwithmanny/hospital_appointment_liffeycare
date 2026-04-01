"use client";

import Link from "next/link";
import {
  Activity,
  Heart,
  Shield,
  Users,
  Target,
  Award,
  ArrowRight,
  CheckCircle,
  Star,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { useEffect, useState } from "react";

const values = [
  {
    icon: Heart,
    title: "Patient-First Care",
    description: "Every decision we make starts with what's best for our patients. Their health and wellbeing is our ultimate priority.",
  },
  {
    icon: Shield,
    title: "Trust & Transparency",
    description: "We believe in open communication and honest practices. No hidden fees, no surprises—just clear, quality care.",
  },
  {
    icon: Users,
    title: "Inclusive Healthcare",
    description: "Quality healthcare should be accessible to everyone. We're breaking down barriers to medical access.",
  },
  {
    icon: Target,
    title: "Excellence in Everything",
    description: "From our technology to our providers, we maintain the highest standards of quality and professionalism.",
  },
];

const stats = [
  { number: "50,000+", label: "Patients Served" },
  { number: "500+", label: "Expert Doctors" },
  { number: "25+", label: "Medical Specialties" },
  { number: "15", label: "Years of Excellence" },
];

const team = [
  {
    name: "Dr. Amanda Chen",
    role: "Chief Medical Officer",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
    bio: "Board-certified internist with 20+ years of experience in patient care and healthcare innovation.",
  },
  {
    name: "James Wilson",
    role: "CEO & Co-Founder",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    bio: "Former healthcare consultant passionate about leveraging technology to improve patient outcomes.",
  },
  {
    name: "Dr. Sarah Mitchell",
    role: "Head of Operations",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80",
    bio: "Healthcare administrator dedicated to streamlining processes and enhancing patient experiences.",
  },
];

const milestones = [
  { year: "2009", title: "Founded in Dublin", description: "LiffeyCare began with a mission to transform healthcare accessibility." },
  { year: "2014", title: "Digital Platform Launch", description: "Introduced our first online appointment booking system." },
  { year: "2018", title: "National Expansion", description: "Extended services to cover all major cities across the country." },
  { year: "2022", title: "AI-Powered Diagnostics", description: "Integrated advanced AI tools for faster, more accurate diagnoses." },
  { year: "2026", title: "50,000 Patients", description: "Reached milestone of serving 50,000+ patients with 98% satisfaction." },
];

export default function AboutPage() {
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
              <Link href="/about" className="text-sm font-medium text-brand transition-colors">
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
              <Award className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-brand">About Us</span>
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-6">
              Healthcare designed around{" "}
              <span className="text-brand">you</span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              For over 15 years, LiffeyCare has been at the forefront of transforming 
              how patients access quality healthcare. We believe everyone deserves 
              convenient, affordable, and compassionate medical care.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-3xl sm:text-4xl font-semibold text-brand">{stat.number}</p>
                <p className="text-sm text-text-secondary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative">
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80"
                  alt="Healthcare team"
                  className="w-full h-[400px] sm:h-[500px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-lg p-6 max-w-xs hidden sm:block">
                <div className="flex items-center gap-3 mb-3">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <p className="text-sm text-text-secondary">
                  "The best healthcare experience I've ever had. Truly patient-centered care."
                </p>
                <p className="text-sm font-medium text-text-primary mt-2">— Maria S., Patient</p>
              </div>
            </div>
            <div>
              <span className="text-label text-brand mb-4 block">Our Mission</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-6">
                Making quality healthcare accessible to everyone
              </h2>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-6">
                At LiffeyCare, we're on a mission to democratize healthcare. We believe 
                that geography, income, or busy schedules should never be barriers to 
                receiving world-class medical care.
              </p>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-8">
                Through innovative technology and a network of dedicated healthcare 
                professionals, we're building a future where everyone can access the 
                care they need, when they need it.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/services" className="btn-primary inline-flex items-center justify-center gap-2">
                  Explore Our Services
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/careers" className="btn-secondary inline-flex items-center justify-center gap-2">
                  Join Our Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="py-16 sm:py-20 lg:py-32 bg-brand-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <span className="text-label text-brand mb-4 block">Project</span>
            <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight mb-6">
              Created with passion
            </h2>
            <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
              <p className="text-text-secondary leading-relaxed mb-4">
                <strong className="text-text-primary">LiffeyCare</strong> was created by
              </p>
              <p className="text-xl font-semibold text-brand mb-2">
                Adeniyi Emmanuel
              </p>
              <p className="text-text-secondary">
                Computer Science BSc<br />
                Dorset College, Dublin<br />
                2026
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-20 lg:py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-label text-brand mb-4 block">Our Values</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-4">
              Principles that guide us
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              These core values shape every decision we make and every interaction we have.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="feature-card group p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center mb-4 transition-colors group-hover:bg-brand">
                  <value.icon className="w-6 h-6 text-brand transition-colors group-hover:text-white" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{value.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-label text-brand mb-4 block">Our Journey</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-4">
              Milestones along the way
            </h2>
          </div>

          <div className="relative">
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-border sm:-translate-x-1/2" />
            <div className="space-y-8 sm:space-y-12">
              {milestones.map((milestone, index) => (
                <div
                  key={milestone.year}
                  className={`relative flex flex-col sm:flex-row gap-4 sm:gap-8 ${
                    index % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                >
                  <div className="sm:w-1/2 sm:text-right">
                    <div className={`bg-surface rounded-2xl border border-border p-6 ${index % 2 === 0 ? "sm:mr-8" : "sm:ml-8"}`}>
                      <span className="text-brand font-semibold text-lg">{milestone.year}</span>
                      <h3 className="text-lg font-semibold text-text-primary mt-2 mb-2">{milestone.title}</h3>
                      <p className="text-sm text-text-secondary">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-4 sm:left-1/2 w-4 h-4 bg-brand rounded-full border-4 border-white shadow-sm sm:-translate-x-1/2" />
                  <div className="sm:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 sm:py-20 lg:py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-label text-brand mb-4 block">Leadership</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-4">
              Meet our team
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              Passionate leaders dedicated to transforming healthcare.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-text-primary">{member.name}</h3>
                  <p className="text-brand font-medium text-sm mb-3">{member.role}</p>
                  <p className="text-sm text-text-secondary">{member.bio}</p>
                </div>
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
                Ready to experience better healthcare?
              </h2>
              <p className="text-brand-light text-base sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8">
                Join thousands of patients who have already discovered the LiffeyCare difference.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white text-brand font-semibold rounded-xl hover:bg-white/90 transition-colors"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20"
                >
                  Contact Us
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
                <a href="/contact" className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-text-tertiary hover:bg-white/20 hover:text-white transition-colors">
                  <MapPin className="w-5 h-5" />
                </a>
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
