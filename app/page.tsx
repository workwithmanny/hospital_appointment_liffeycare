"use client";

import Link from "next/link";
import {
  Heart,
  Calendar,
  Users,
  Shield,
  CheckCircle,
  Clock,
  Star,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Activity,
  Stethoscope,
  ChevronRight,
  Play,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";

function AnimatedCounter({ end, duration = 2000 }: { end: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const numericValue = parseInt(end.replace(/[^0-9]/g, ""));
  const suffix = end.replace(/[0-9]/g, "");

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * numericValue));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [numericValue, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    { number: "50000+", label: "Patients Helped" },
    { number: "500+", label: "Expert Doctors" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "24/7", label: "Support Available" },
  ];

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Book appointments instantly with real-time availability. No more phone calls or waiting.",
    },
    {
      icon: Users,
      title: "Expert Specialists",
      description: "Access top-rated doctors across all medical specialties, verified and reviewed.",
    },
    {
      icon: Shield,
      title: "Secure Records",
      description: "Your health data is protected with bank-level encryption and privacy controls.",
    },
    {
      icon: Activity,
      title: "Health Tracking",
      description: "Monitor your health metrics and progress with intuitive dashboards and insights.",
    },
  ];

  const services = [
    {
      title: "Primary Care",
      description: "Comprehensive health checkups and preventive care for your whole family.",
      icon: Stethoscope,
      color: "bg-teal-50 text-teal-600",
    },
    {
      title: "Specialist Care",
      description: "Direct access to cardiologists, neurologists, dermatologists, and more.",
      icon: Heart,
      color: "bg-rose-50 text-rose-600",
    },
    {
      title: "Diagnostics",
      description: "Fast and accurate lab tests, imaging, and diagnostic procedures.",
      icon: Activity,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Mental Health",
      description: "Confidential counseling and therapy sessions with licensed professionals.",
      icon: Sparkles,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  const doctors = [
    {
      name: "Dr. Sarah Mitchell",
      specialty: "Cardiologist",
      rating: 4.9,
      reviews: 128,
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
    },
    {
      name: "Dr. Raj Patel",
      specialty: "Neurologist",
      rating: 4.8,
      reviews: 95,
      image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
    },
    {
      name: "Dr. Emily Okonkwo",
      specialty: "Pediatrician",
      rating: 5.0,
      reviews: 210,
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
    },
  ];

  const footerLinks = [
    {
      title: "Patients",
      links: [
        { label: "Find a Doctor", href: "/doctors" },
        { label: "Book Appointment", href: "/doctors" },
        { label: "Patient Portal", href: "/auth/login" },
        { label: "Insurance", href: "/insurance" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
        { label: "Blog", href: "/blog" },
      ],
    },
    {
      title: "Providers",
      links: [
        { label: "Doctor Login", href: "/auth/login" },
        { label: "Admin Login", href: "/auth/login/admin" },
        { label: "Join Network", href: "/careers" },
        { label: "Resources", href: "/services" },
      ],
    },
  ];

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
              <Link href="/services" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Services</Link>
              <Link href="/doctors" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Doctors</Link>
              <Link href="/about" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">About</Link>
              <Link href="/contact" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">Contact</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-4 py-2"
              >
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
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-light border border-brand/20 px-4 py-2">
                <span className="text-sm font-medium text-brand">
                  Trusted by 50,000+ patients
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-display font-semibold leading-tight">
                Healthcare that puts{" "}
                <span className="text-brand">you first</span>
              </h1>

              <p className="text-base sm:text-lg text-text-secondary max-w-lg leading-relaxed">
                Experience seamless healthcare booking, expert consultations, and
                secure health records—all in one beautiful platform designed for
                modern life.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/doctors" className="btn-primary inline-flex items-center justify-center gap-2 h-12 sm:h-auto">
                  Book Appointment
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="btn-secondary inline-flex items-center justify-center gap-2 h-12 sm:h-auto">
                  <Play className="w-4 h-4" />
                  Watch Demo
                </button>
              </div>
            </div>

            <div className="relative animate-slide-in-right">
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80"
                  alt="Modern healthcare consultation"
                  className="w-full h-[350px] sm:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 glass-card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                  <div className="flex -space-x-2">
                    <img
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                      alt="Patient"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                      alt="Patient"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80"
                      alt="Patient"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1472099645785-f1b5022eb634?auto=format&fit=crop&w=100&q=80"
                      alt="Patient"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover hidden sm:block"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary text-sm sm:text-base truncate">Join 50,000+ patients</p>
                    <p className="text-xs sm:text-sm text-text-secondary truncate">Book your first appointment</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 shrink-0">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-text-primary text-sm">4.9</span>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-4 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">98% Success</p>
                    <p className="text-xs text-text-secondary">Patient satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="text-center animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-brand">
                  <AnimatedCounter end={stat.number} />
                </p>
                <p className="text-sm text-text-secondary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="services" className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
            <span className="text-label text-brand mb-4 block">Why Choose Us</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-4">Everything you need for better health</h2>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              From booking to recovery, we provide all the tools you need to manage
              your healthcare journey with ease.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="feature-card group p-5 sm:p-6"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-light flex items-center justify-center mb-3 sm:mb-4 transition-colors group-hover:bg-brand">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-brand transition-colors group-hover:text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 sm:py-20 lg:py-32 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-label text-brand mb-4 block">Our Services</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight mb-4 sm:mb-6">Comprehensive care for every need</h2>
              <p className="text-base sm:text-lg text-text-secondary leading-relaxed mb-6 sm:mb-8">
                We offer a wide range of medical services to ensure you receive the
                best care possible, all accessible through our simple platform.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.title}
                    className="p-4 rounded-xl border border-border bg-white hover:shadow-md transition-all duration-200"
                  >
                    <div className={`w-10 h-10 rounded-lg ${service.color} flex items-center justify-center mb-3`}>
                      <service.icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-semibold text-text-primary mb-1">{service.title}</h4>
                    <p className="text-sm text-text-secondary">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0">
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=800&q=80"
                  alt="Healthcare services"
                  className="w-full h-[350px] sm:h-[500px] object-cover"
                />
              </div>
              <div className="static sm:absolute sm:-bottom-6 sm:-left-6 mt-4 sm:mt-0 bg-white rounded-2xl shadow-lg p-4 sm:p-6 sm:max-w-xs">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brand-light flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-brand" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary text-sm sm:text-base">Next Available</p>
                    <p className="text-xs sm:text-sm text-text-secondary">Today at 2:00 PM</p>
                  </div>
                </div>
                <button className="w-full btn-primary text-center h-11 sm:h-auto" onClick={() => window.location.href='/doctors'}>
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="py-16 sm:py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
            <div>
              <span className="text-label text-brand mb-2 sm:mb-4 block">Top Specialists</span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-text-primary tracking-tight">Meet our expert doctors</h2>
            </div>
            <Link
              href="/doctors"
              className="btn-secondary inline-flex items-center justify-center gap-2 self-start sm:self-auto h-11"
            >
              View All Doctors
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {doctors.map((doctor) => (
              <article
                key={doctor.name}
                className="group bg-surface rounded-xl sm:rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 sm:px-3 sm:py-1 flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                    <span className="text-xs sm:text-sm font-semibold">{doctor.rating}</span>
                  </div>
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-1">{doctor.name}</h3>
                  <p className="text-sm text-text-secondary mb-3 sm:mb-4">{doctor.specialty}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-text-secondary">{doctor.reviews} reviews</span>
                    <Link
                      href="/doctors"
                      className="text-xs sm:text-sm font-medium text-brand hover:text-brand-hover transition-colors inline-flex items-center gap-1"
                    >
                      View Profile
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </article>
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
                Ready to take control of your health?
              </h2>
              <p className="text-brand-light text-base sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8">
                Join thousands of patients who have already discovered the future
                of healthcare. Book your first appointment today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white text-brand font-semibold rounded-xl hover:bg-white/90 transition-colors h-12 sm:h-auto"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="tel:+15551234567"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/20 h-12 sm:h-auto"
                >
                  <Phone className="w-4 h-4" />
                  (555) 123-4567
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
                {[Mail, Phone, MapPin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-text-tertiary hover:bg-white/20 hover:text-white transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {footerLinks.map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold text-white mb-4">{section.title}</h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-text-tertiary hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
              <Link
                href="/auth/login/admin"
                className="text-text-tertiary hover:text-white transition-colors"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
