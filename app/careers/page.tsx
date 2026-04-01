"use client";

import Link from "next/link";
import {
  Activity,
  Heart,
  Users,
  Zap,
  Globe,
  Coffee,
  Briefcase,
  GraduationCap,
  ArrowRight,
  CheckCircle,
  MapPin,
  Clock,
  DollarSign,
  Mail,
  Phone,
} from "lucide-react";
import { useEffect, useState } from "react";

const benefits = [
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "Comprehensive medical, dental, and vision coverage for you and your family.",
  },
  {
    icon: Zap,
    title: "Flexible Time Off",
    description: "Unlimited PTO, parental leave, and flexible work arrangements.",
  },
  {
    icon: GraduationCap,
    title: "Learning & Development",
    description: "Annual learning stipend and access to courses, conferences, and certifications.",
  },
  {
    icon: Globe,
    title: "Remote Friendly",
    description: "Work from anywhere with our distributed-first culture and home office stipend.",
  },
  {
    icon: Coffee,
    title: "Work-Life Balance",
    description: "Wellness programs, mental health support, and regular team events.",
  },
  {
    icon: DollarSign,
    title: "Competitive Compensation",
    description: "Market-leading salaries, equity options, and 401(k) matching.",
  },
];

const openPositions = [
  {
    id: 1,
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build the next generation of healthcare technology that connects patients with providers.",
  },
  {
    id: 2,
    title: "Product Designer",
    department: "Design",
    location: "Dublin / Remote",
    type: "Full-time",
    description: "Create beautiful, intuitive experiences that make healthcare accessible to everyone.",
  },
  {
    id: 3,
    title: "Physician Partnerships Manager",
    department: "Growth",
    location: "Dublin",
    type: "Full-time",
    description: "Expand our network of healthcare providers and build lasting partnerships.",
  },
  {
    id: 4,
    title: "Customer Success Specialist",
    department: "Support",
    location: "Remote",
    type: "Full-time",
    description: "Help patients navigate their healthcare journey with empathy and expertise.",
  },
  {
    id: 5,
    title: "Healthcare Data Analyst",
    department: "Data",
    location: "Remote",
    type: "Full-time",
    description: "Transform healthcare data into insights that improve patient outcomes.",
  },
  {
    id: 6,
    title: "Marketing Manager",
    department: "Marketing",
    location: "Dublin / Remote",
    type: "Full-time",
    description: "Drive growth and tell the LiffeyCare story to patients and providers.",
  },
];

const departments = ["All", "Engineering", "Design", "Growth", "Support", "Data", "Marketing"];

const values = [
  {
    title: "Patient First",
    description: "Every decision we make starts with our patients' wellbeing",
  },
  {
    title: "Move Fast",
    description: "We ship quickly and learn from real-world feedback",
  },
  {
    title: "Be Kind",
    description: "We treat everyone with empathy, respect, and compassion",
  },
  {
    title: "Stay Curious",
    description: "We never stop learning and questioning the status quo",
  },
];

export default function CareersPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("All");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredPositions = selectedDepartment === "All"
    ? openPositions
    : openPositions.filter((p) => p.department === selectedDepartment);

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
              <Briefcase className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-brand">We're Hiring</span>
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight mb-6">
              Join us in transforming{" "}
              <span className="text-brand">healthcare</span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              We're building a world where quality healthcare is accessible to everyone. 
              Come be part of something that truly matters.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="font-display text-3xl sm:text-4xl font-semibold text-brand">150+</p>
              <p className="text-sm text-text-secondary mt-1">Team Members</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl sm:text-4xl font-semibold text-brand">25+</p>
              <p className="text-sm text-text-secondary mt-1">Countries</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl sm:text-4xl font-semibold text-brand">4.9</p>
              <p className="text-sm text-text-secondary mt-1">Employee Rating</p>
            </div>
            <div className="text-center">
              <p className="font-display text-3xl sm:text-4xl font-semibold text-brand">100%</p>
              <p className="text-sm text-text-secondary mt-1">Remote Friendly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-label text-brand mb-4 block">Why Join Us</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-4">
              Benefits that put you first
            </h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              We believe in taking care of our team so they can take care of others.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="feature-card group p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center mb-4 transition-colors group-hover:bg-brand">
                  <benefit.icon className="w-6 h-6 text-brand transition-colors group-hover:text-white" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{benefit.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-20 lg:py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-label text-brand mb-4 block">Our Culture</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-6">
                Values that guide us
              </h2>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-8">
                Our culture is built on a shared commitment to improving healthcare. 
                These principles shape how we work, collaborate, and innovate together.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                {values.map((value) => (
                  <div key={value.title} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">{value.title}</h3>
                      <p className="text-sm text-text-secondary">{value.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                  alt="Team collaboration"
                  className="w-full h-[400px] sm:h-[500px] object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-lg p-6 hidden sm:block">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center">
                    <Users className="w-6 h-6 text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Great Place to Work</p>
                    <p className="text-sm text-text-secondary">Certified 2023-2026</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-label text-brand mb-4 block">Open Positions</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-4">
              Find your next role
            </h2>
          </div>

          {/* Department Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedDepartment === dept
                    ? "bg-brand text-white"
                    : "bg-surface text-text-secondary hover:bg-border"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Positions List */}
          <div className="space-y-4">
            {filteredPositions.map((position) => (
              <div
                key={position.id}
                className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-brand bg-brand-light px-2 py-1 rounded-full">
                        {position.department}
                      </span>
                      <span className="text-xs text-text-secondary flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {position.location}
                      </span>
                      <span className="text-xs text-text-secondary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {position.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">{position.title}</h3>
                    <p className="text-sm text-text-secondary">{position.description}</p>
                  </div>
                  <button className="btn-primary whitespace-nowrap inline-flex items-center gap-2 self-start">
                    Apply Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredPositions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-text-secondary">No open positions in this department at the moment.</p>
            </div>
          )}
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
                Don't see the right fit?
              </h2>
              <p className="text-brand-light text-base sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8">
                We're always looking for talented people who are passionate about healthcare. 
                Send us your resume and we'll keep you in mind for future opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <a
                  href="mailto:contact@liffeycare.online"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white text-brand font-semibold rounded-xl hover:bg-white/90 transition-colors"
                >
                  Send General Application
                  <ArrowRight className="w-4 h-4" />
                </a>
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
