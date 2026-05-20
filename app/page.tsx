"use client";

import { useState, useEffect, useRef } from "react";

const NAV_LINKS = ["How It Works", "About", "Testimonials"];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: "🎯",
    title: "Choose Your Course",
    desc: "Pick any subject-> physics, math, literature, coding. StridenexLearn handles any domain, no fixed curriculum.",
  },
  {
    step: "02",
    icon: "🧠",
    title: "AI Teaches, Not Just Answers",
    desc: "Your AI tutor explains concepts deeply, asks follow-up questions, and guides you to understand, never spoon-feeds.",
  },
  {
    step: "03",
    icon: "📈",
    title: "It Adapts To You",
    desc: "Based on your responses and quiz scores, the system detects where you need more help and adjusts in real time.",
  },
  {
    step: "04",
    icon: "✅",
    title: "Master Through Practice",
    desc: "Quizzes, assignments, and guided problem-solving sessions reinforce learning until true mastery is achieved.",
  },
];

const TESTIMONIALS = [
  {
    name: "Amara Osei",
    role: "WAEC Student, Lagos",
    avatar: "AO",
    text: "I was failing physics before StridenexLearn. The AI doesn't just give me answers, it actually makes me think. My grades went from D to B+ in two months.",
  },
  {
    name: "David Nwosu",
    role: "University Freshman, Abuja",
    avatar: "DN",
    text: "What I love is that it stays on topic. When I'm in my Chemistry course, everything is chemistry. It feels like having a private tutor available 24/7.",
  },
  {
    name: "Fatima Al-Hassan",
    role: "High School Teacher, Kano",
    avatar: "FA",
    text: "I recommend StridenexLearn to all my students as a supplement. It teaches the way I wish I had time to patiently, adaptively, and with real depth.",
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          }
        });
      },
      { threshold: 0.15 }
    );
    document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  return (
    <main className="min-h-screen bg-[#060D1F] text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');

        * { box-sizing: border-box; }

        .font-display { font-family: 'Syne', sans-serif; }

        .glow-text {
          background: linear-gradient(135deg, #ffffff 0%, #7FFFD4 50%, #00CED1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .teal-glow {
          box-shadow: 0 0 40px rgba(0, 206, 209, 0.25);
        }

        .card-glow:hover {
          box-shadow: 0 0 30px rgba(0, 206, 209, 0.15), 0 20px 60px rgba(0,0,0,0.4);
          transform: translateY(-4px);
          transition: all 0.3s ease;
        }

        .card-glow {
          transition: all 0.3s ease;
        }

        .nav-blur {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .mesh-bg {
          background:
            radial-gradient(ellipse 80% 50% at 10% 20%, rgba(0, 206, 209, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 60% at 90% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(0, 206, 209, 0.04) 0%, transparent 70%);
        }

        .grid-pattern {
          background-image: linear-gradient(rgba(0,206,209,0.04) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,206,209,0.04) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .fade-up {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        .fade-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .delay-1 { transition-delay: 0.1s; }
        .delay-2 { transition-delay: 0.2s; }
        .delay-3 { transition-delay: 0.3s; }
        .delay-4 { transition-delay: 0.4s; }

        .btn-primary {
          background: linear-gradient(135deg, #00CED1, #008B8B);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .btn-primary:hover::after { opacity: 1; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,206,209,0.4); }

        .btn-outline {
          border: 1.5px solid rgba(0,206,209,0.4);
          transition: all 0.3s ease;
        }
        .btn-outline:hover {
          border-color: #00CED1;
          background: rgba(0,206,209,0.08);
          transform: translateY(-2px);
        }

        .step-number {
          font-family: 'Syne', sans-serif;
          font-size: 5rem;
          font-weight: 800;
          line-height: 1;
          background: linear-gradient(135deg, rgba(0,206,209,0.2), rgba(0,206,209,0.05));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .testimonial-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid rgba(255,255,255,0.07);
          transition: all 0.3s ease;
        }
        .testimonial-card:hover {
          border-color: rgba(0,206,209,0.25);
          background: linear-gradient(135deg, rgba(0,206,209,0.06) 0%, rgba(255,255,255,0.02) 100%);
          transform: translateY(-4px);
        }

        .avatar {
          background: linear-gradient(135deg, #00CED1, #6366F1);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        .float { animation: float 6s ease-in-out infinite; }

        .hero-badge {
          background: linear-gradient(135deg, rgba(0,206,209,0.15), rgba(0,206,209,0.05));
          border: 1px solid rgba(0,206,209,0.3);
        }

        .about-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,206,209,0.03) 100%);
          border: 1px solid rgba(255,255,255,0.06);
        }

        .mobile-menu {
          background: rgba(6, 13, 31, 0.97);
          backdrop-filter: blur(20px);
        }

        .section-label {
          color: #00CED1;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 600;
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "nav-blur border-b border-white/5 bg-[#060D1F]/80" : ""}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center text-sm font-bold teal-glow">
              SL
            </div>
            <span className="font-display font-bold text-lg tracking-tight">StridenexLearn</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-sm text-white/60 hover:text-white transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a href="#" className="btn-outline text-sm px-4 py-2 rounded-lg text-white/80">
              Sign In
            </a>
            <a href="#" className="btn-primary text-sm px-5 py-2 rounded-lg font-medium text-white">
              Get Started Free
            </a>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="mobile-menu md:hidden border-t border-white/5 px-6 py-6 flex flex-col gap-5">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-white/70 hover:text-white transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
              <a href="#" className="btn-outline text-sm px-4 py-2.5 rounded-lg text-center text-white/80">Sign In</a>
              <a href="#" className="btn-primary text-sm px-4 py-2.5 rounded-lg text-center font-medium">Get Started Free</a>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center mesh-bg grid-pattern pt-16" ref={heroRef}>
        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-teal-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center py-20">
          {/* Badge */}
          <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm text-teal-300">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            AI-Powered Adaptive Tutoring
          </div>

          {/* Headline */}
          <h1 className="font-display font-extrabold leading-none mb-6">
            <span className="block text-5xl md:text-7xl lg:text-8xl text-white mb-2">Learn Deeper.</span>
            <span className="block text-5xl md:text-7xl lg:text-8xl glow-text">Think Smarter.</span>
          </h1>

          {/* Subheadline */}
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/50 mb-10 leading-relaxed">
            StridenexLearn is an AI-powered adaptive tutor. It learns how you learn 
            adjusting explanations, generating quizzes, and guiding you through
            courses and assignments at your own pace, and adapting to your level across any subject, any time.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#" className="btn-primary px-8 py-4 rounded-xl text-base font-semibold teal-glow">
              Start Learning Free →
            </a>
            <a href="#how-it-works" className="btn-outline px-8 py-4 rounded-xl text-base text-white/70">
              See How It Works
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/30">
            <span>✓ No credit card required</span>
            <span className="hidden sm:inline">·</span>
            <span>✓ Any subject, any level</span>
            <span className="hidden sm:inline">·</span>
            <span>✓ Adapts to you</span>
          </div>

          {/* Floating visual */}
          <div className="float mt-16 mx-auto w-full max-w-2xl">
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="avatar w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0">AI</div>
                <div>
                  <p className="text-sm text-white/40 mb-1">StridenexLearn Tutor · Physics</p>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Great! Before we continue, let me ask <span className="text-teal-300">can you explain in your own words why objects in free fall accelerate at the same rate regardless of their mass?</span>
                  </p>
                </div>
              </div>
              <div className="ml-13 pl-13 border-l-2 border-teal-500/20 ml-[52px] pl-4">
                <p className="text-white/40 text-xs italic">This builds understanding, not just recall.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-28 relative">
        <div className="max-w-6xl mx-auto px-6">
          <div
            id="hiw-header"
            data-animate
            className={`fade-up text-center mb-16 ${isVisible("hiw-header") ? "visible" : ""}`}
          >
            <p className="section-label mb-3">Process</p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-4">How It Works</h2>
            <p className="text-white/40 max-w-xl mx-auto">Four steps from confused to confident guided by AI that genuinely teaches.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={item.step}
                id={`hiw-${i}`}
                data-animate
                className={`fade-up delay-${i + 1} card-glow ${isVisible(`hiw-${i}`) ? "visible" : ""} about-card rounded-2xl p-8 relative overflow-hidden`}
              >
                <div className="absolute top-4 right-6 step-number">{item.step}</div>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-display font-bold text-xl text-white mb-3">{item.title}</h3>
                <p className="text-white/50 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="py-28 relative mesh-bg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div
              id="about-left"
              data-animate
              className={`fade-up ${isVisible("about-left") ? "visible" : ""}`}
            >
              <p className="section-label mb-3">About</p>
              <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-6 leading-tight">
                The AI tutor that <span className="glow-text">thinks like a teacher</span>
              </h2>
              <p className="text-white/50 leading-relaxed mb-6">
                Most AI tools just answer questions. StridenexLearn is built differently. 
                It starts by assuming you're a beginner, regardless of your actual level 
                and builds up your understanding layer by layer through guided questions and explanations.
              </p>
              <p className="text-white/50 leading-relaxed mb-8">
                It's not here to replace your teachers. It's here to be the patient, available, 
                always-adapting assistant that every student deserves, across any course, any domain.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Any Subject", desc: "No fixed curriculum" },
                  { label: "Truly Adaptive", desc: "Responds to your progress" },
                  { label: "Teaches First", desc: "Never just spoon-feeds" },
                  { label: "Always Available", desc: "24/7 personal tutor" },
                ].map((f) => (
                  <div key={f.label} className="about-card rounded-xl p-4">
                    <p className="text-teal-400 text-sm font-semibold mb-1">{f.label}</p>
                    <p className="text-white/40 text-xs">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — visual panel */}
            <div
              id="about-right"
              data-animate
              className={`fade-up delay-2 ${isVisible("about-right") ? "visible" : ""}`}
            >
              <div className="about-card rounded-2xl p-6 space-y-4">
                <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Live Session Preview</p>
                {/* Course header */}
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-sm">SL</div>
                  <div>
                    <p className="text-white text-sm font-medium">Quantum Physics 101</p>
                    <p className="text-white/30 text-xs"> </p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                </div>

                {/* Chat bubbles */}
                <div className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <div className="avatar w-6 h-6 rounded shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5">AI</div>
                    <div className="bg-white/[0.04] rounded-xl rounded-tl-none px-4 py-2.5 text-white/70 max-w-xs">
                      Let's start from the very beginning. What do you know about wave-particle duality?
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl rounded-tr-none px-4 py-2.5 text-white/70 max-w-xs">
                      I've heard of it but I'm not sure what it means exactly...
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="avatar w-6 h-6 rounded shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5">AI</div>
                    <div className="bg-white/[0.04] rounded-xl rounded-tl-none px-4 py-2.5 text-white/70 max-w-xs">
                      Perfect starting point! Let me explain with an experiment you can actually picture...
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-white/30 mb-2">
                    <span>Understanding Score</span>
                    <span className="text-teal-400">Building...</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-teal-500 to-teal-300 h-1.5 rounded-full" style={{ width: "35%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div
            id="test-header"
            data-animate
            className={`fade-up text-center mb-16 ${isVisible("test-header") ? "visible" : ""}`}
          >
            <p className="section-label mb-3">Testimonials</p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-4">What Students Are Saying</h2>
            <p className="text-white/40 max-w-xl mx-auto">Real learners. Real results. No spoon-feeding.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                id={`test-${i}`}
                data-animate
                className={`fade-up delay-${i + 1} ${isVisible(`test-${i}`) ? "visible" : ""} testimonial-card rounded-2xl p-6`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="avatar w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-white/30 text-xs">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, s) => (
                    <span key={s} className="text-teal-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-white/55 text-sm leading-relaxed">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-6">
        <div
          id="cta-banner"
          data-animate
          className={`fade-up ${isVisible("cta-banner") ? "visible" : ""} max-w-4xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden`}
          style={{ background: "linear-gradient(135deg, rgba(0,206,209,0.12) 0%, rgba(99,102,241,0.08) 100%)", border: "1px solid rgba(0,206,209,0.2)" }}
        >
          <div className="absolute inset-0 grid-pattern opacity-30 rounded-3xl" />
          <div className="relative">
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-4">
              Ready to learn the right way?
            </h2>
            <p className="text-white/40 mb-8 max-w-xl mx-auto">
              Join students who are mastering their subjects with an AI that teaches, adapts, and grows with them.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#" className="btn-primary px-8 py-4 rounded-xl text-base font-semibold teal-glow">
                Get Started — It's Free
              </a>
              <a href="#" className="btn-outline px-8 py-4 rounded-xl text-base text-white/70">
                Sign In
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg btn-primary flex items-center justify-center text-xs font-bold">AL</div>
            <span className="font-display font-bold text-sm">StridenexLearn</span>
          </div>
          <p className="text-white/20 text-xs text-center">© 2026 StridenexLearn. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/60 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}