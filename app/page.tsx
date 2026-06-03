"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LOGO_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA62mPFla2zkL7VmKTn-l_8Raf3N7vRuMUt42I-P7q5s-kHFXHSt5ANKIzOKLo8Ggwnsv0_geGEBAzuAC3ULErW2kapdhXLl-x0YU_wQ6Cvj9uiCSpx-rHmU_RxhqFObhYlfZ9IJ-1ZztILViWD1wsPHAM6B_1P5SGTBK-bJWpt31hgE-witjgIWeHfaWUaU449QQIxH6M3yM3lICgBPZVX_nuya5hs-gnvEcuyoILgcY93oL9z94w30gsKFi67CNEzspWJeYOh8-Ep";

const HERO_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC5ZT9-z3Hd3YB86cmodEWNfMsVfcsyr5brhfJfXhQarZtB_ZHsyFdtOYTAagJqo8EBGmgvYyMNgXWw-S2nmaES_Wza5NDeDC_RWA2ESDEui5XooW7MQgKzd6mn3yO2k7S4DCp19EDsX1tFapVdk0tqsedg1QUcT28ZhxlzEX7BBtqWOFWZTrnUPIUbr8tlihTdYvMj1OfcBN6eUDwHeg1XzmpLpZAH_EfSc00lG77-4fbx51U8Nns4hHrH55PMZKEbRl4kkdkqFrxE";

const TESTIMONIALS = [
  {
    name: "Amara Osei",
    role: "WAEC Student, Lagos",
    rating: ["star", "star", "star", "star", "star"],
    text: "I was failing physics before StridenexLearn. The AI doesn't just give me answers — it actually makes me think. My grades went from D to B+ in two months.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDYpZ4DllhVI0LjhI7xskGOc1UW-mhhBuOUsdTb5sPJpuQzQOZn7m2goKdS2fMCKkmdrUTphE2xrsUSPu4VLxyBJ2WByngWVBzo8PWdtgn8Ya6C63N4xedmVmZDFS40DxM3rQra07XVmREAwUoQjJdP5mQIErbS8nDKfHef6oF9AOfd1O6dLkIttN5SeTJdNNLvnDBqTkbJW8f6Q5_Sy4IkT26waKsrQzuSXS-Dp1Sd2kydIjspFEx2aNiNyPKqPb4M8Yp3bs1gfugR",
  },
  {
    name: "David Nwosu",
    role: "University Freshman, Abuja",
    rating: ["star", "star", "star", "star", "star_half"],
    text: "What I love is that it stays on topic. When I'm in my Chemistry course, everything is chemistry. It feels like having a private tutor available 24/7.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDiR2Ug8HvcRZvwQdmlEOmj_oRqubQ_zz9RaYbfcEqtLkTyd7AcEoE9p46WQfOQ0aB8-0Qxb9cgQJtEGTKWcGft90YUG65UYYDlpV5mo_AAxfIaqQmdCw7zp8oLVHJ1aaujAKqsbPschGSV2yCWFVBq-KSwUoOPa9dvQzSYHJI6vJ9pH0A6Fdh9kINhuGGEUKhHWP5RD-DxU-nVLJkuYKKlN5zlkH3nX6DML6zCyHomh2fT4BUZLFm9hhoiSGRq8ZhX-1yO6fp3TyFH",
  },
  {
    name: "Fatima Al-Hassan",
    role: "High School Teacher, Kano",
    rating: ["star", "star", "star", "star", "star"],
    text: "I recommend StridenexLearn to all my students as a supplement. It teaches the way I wish I had time to — patiently, adaptively, and with real depth.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB-ub9PRGA9ZWR925jWIeyGwzckNGA_KwXc4BRSlKXZHAgtW46LjeYIoUmUVTEtxB1RxnL9HY4cG9_QnHVr5_T_oYY0qhMgPERCa9U3OjJUJx2VWHoOvwIlxJPlIqXzT0iHNSSqkwqu__8vL7pEPF_simeEwpNSrO2yTysvKkTwAfhCS1-DeADeHcYjqZXE-bbDtrRMX7NxSz65SHeVtCW4wJ8aKXzeW61hyWzZe0zqpQQM3PeQLkSPZNQ3GwEJk3xXpR5PcwDHdzuL",
  },
];

const FEATURES = [
  {
    icon: "route",
    title: "Adaptive Intelligence",
    text: "StridenextLearn tracks your performance and adjusts explanations - more detailed when struggling, concise when you've got it.",
  },
  {
    icon: "analytics",
    title: "Real-time AI Feedback",
    text: "Receive instant, detailed explanation on your courses, just like having a dedicated tutor sitting beside you 24/7.",
  },
  {
    icon: "quiz",
    title: "Auto-Generated Quizzes",
    text: "StridenextLearn reads your history to create relevant quizzes automatically - testing what you've actually learned.",
  },
  {
    icon: "account_tree",
    title: "Flexible Curriculum",
    text: "Allows you to define the course outline and then follows that strictly, So as to make sure you get what you came to learn to the core.",
  },
  {
    icon: "speed",
    title: "Cognitive Load Balancing",
    text: 'Automatically adjusting the difficulty and volume of information to keep you in the "flow state" without burning out.',
  },
];

const STEPS = [
  {
    icon: "query_stats",
    title: "Create Your Course",
    text: "Pick any subject - physics, math, literature, coding. No fixed curriculum. You define what you learn.",
  },
  {
    icon: "map",
    title: "AI Teaches, Not Answers",
    text: "Your tutor explains concepts deeply, asks follow-up questions, and guides you to real understanding.",
  },
  {
    icon: "model_training",
    title: "It Adapts to You",
    text: "Based on your responses and scores, the system detects weak areas and adjusts difficulty in real time.",
  },
  {
    icon: "verified",
    title: "Master Through Practice",
    text: "Quizzes, assignments, and guided problem-solving reinforce learning until you truly get it.",
  },
];

const TYPING_PHRASES = [
  "Adaptive Learning ",
  "Precision AI Feedback",
  "Works With Any Course",
  "Frictionless Mastery",
  "StridenextLearn",
];

function MaterialIcon({
  children,
  className = "",
  fill = false,
}: {
  children: string;
  className?: string;
  fill?: boolean;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24` }}
    >
      {children}
    </span>
  );
}

function FeatureCard({ icon, title, text }: (typeof FEATURES)[number]) {
  return (
    <div className="feature-card rounded-2xl border border-[rgba(200,197,208,0.3)] bg-white p-10 soft-depth">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e3dfff]">
        <MaterialIcon className="text-3xl text-[#4e45d5]" fill>
          {icon}
        </MaterialIcon>
      </div>
      <h3 className="mb-5 font-serif text-3xl font-bold leading-tight text-[#070235]">{title}</h3>
      <p className="text-lg leading-8 text-[#47464f]">{text}</p>
    </div>
  );
}

export default function LandingPage() {
  const [typedText, setTypedText] = useState("");

  const scrollToSection = (sectionId: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  useEffect(() => {
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const type = () => {
      const currentPhrase = TYPING_PHRASES[phraseIndex];
      const nextIndex = isDeleting ? charIndex - 1 : charIndex + 1;

      setTypedText(currentPhrase.substring(0, nextIndex));
      charIndex = nextIndex;

      let typeSpeed = isDeleting ? 50 : 100;

      if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        typeSpeed = 2000;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % TYPING_PHRASES.length;
        typeSpeed = 500;
      }

      timeoutId = setTimeout(type, typeSpeed);
    };

    timeoutId = setTimeout(type, 400);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

        html {
          scroll-behavior: smooth;
        }

        .landing-page {
          --surface: #f7f9fb;
          --primary: #070235;
          --secondary: #4e45d5;
          --secondary-fixed: #e3dfff;
          --on-secondary-fixed: #100069;
          --surface-container-low: #f2f4f6;
          --surface-container-lowest: #ffffff;
          --on-surface-variant: #47464f;
          --outline-variant: #c8c5d0;
          background: var(--surface);
          color: #191c1e;
          font-family: "Inter", sans-serif;
        }

        .landing-page .font-serif {
          font-family: "Playfair Display", serif;
        }

        .landing-page .font-mono {
          font-family: "JetBrains Mono", monospace;
        }

        .soft-depth {
          box-shadow: 0 4px 20px -2px rgba(7, 2, 53, 0.04), 0 2px 8px -1px rgba(0, 88, 190, 0.06);
        }

        .glass-accent {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        @keyframes blink {
          50% {
            opacity: 0;
          }
        }

        .cursor-blink {
          animation: blink 1s infinite;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll {
          animation: scroll 60s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }

        .feature-card {
          flex: 0 0 430px;
        }

        .marquee-mask {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}</style>

      <div className="landing-page min-h-screen">
        <header className="fixed top-0 z-50 w-full bg-[#f7f9fb]/80 shadow-sm backdrop-blur-md">
          <nav className="mx-auto flex h-20 max-w-[1360px] items-center justify-between px-4 md:px-12">
            <a
              className="flex items-center gap-4 font-serif text-2xl font-bold tracking-tight text-[#070235]"
              href="#"
              onClick={(event) => {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
                window.history.replaceState(null, "", window.location.pathname);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="StridenextLearn Logo" className="h-14 w-auto object-contain" src={LOGO_URL} />
              <span>StridenextLearn</span>
            </a>

            <div className="hidden items-center gap-8 md:flex">
              <a
                className="text-sm font-semibold uppercase tracking-wide text-[#47464f] transition-colors hover:text-[#4e45d5]"
                href="#platform"
                onClick={scrollToSection("platform")}
              >
                Platform
              </a>
              <a
                className="text-sm font-semibold uppercase tracking-wide text-[#47464f] transition-colors hover:text-[#4e45d5]"
                href="#features"
                onClick={scrollToSection("features")}
              >
                Features
              </a>
              <a
                className="text-sm font-semibold uppercase tracking-wide text-[#47464f] transition-colors hover:text-[#4e45d5]"
                href="#testimonials"
                onClick={scrollToSection("testimonials")}
              >
                Testimonials
              </a>
              <a
                className="text-sm font-semibold uppercase tracking-wide text-[#47464f] transition-colors hover:text-[#4e45d5]"
                href="#about"
                onClick={scrollToSection("about")}
              >
                About
              </a>
            </div>

            <div className="flex items-center gap-4">
              <Link className="hidden text-sm font-semibold uppercase tracking-wide text-[#070235] transition-opacity hover:opacity-80 md:block" href="/login">
                Sign In
              </Link>
              <Link
                className="rounded-2xl bg-[#4e45d5] px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:brightness-110 active:scale-95"
                href="/signup"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </header>

        <main className="pt-20">
          <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1360px] items-center overflow-hidden px-4 py-12 md:px-12 md:py-20">
            <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] xl:gap-20">
              <div className="z-10 text-center lg:text-left">
                <span className="mb-7 inline-block rounded-full bg-[#e3dfff] px-5 py-2 text-sm font-bold uppercase tracking-wider text-[#100069]">
                  AI-Powered Adaptive tutoring
                </span>
                <h1 className="mb-8 font-serif text-5xl font-bold leading-[0.98] tracking-tight text-[#070235] md:text-7xl xl:text-8xl">
                  The Future of <span className="italic text-[#4e45d5]">Personalized</span> Learning
                </h1>
                <p className="mx-auto mb-11 max-w-2xl text-xl leading-9 text-[#47464f] lg:mx-0">
                  Our intelligent tutoring system adapts to how you learn, adjusting explanations, generating quizzes, and guiding you through any subject
                  at your own pace.
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                  <Link
                    className="rounded-2xl bg-[#4e45d5] px-12 py-5 text-lg font-bold text-white shadow-[0_20px_50px_rgba(78,69,213,0.3)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:brightness-110 active:scale-95"
                    href="/signup"
                  >
                    Start Learning Free
                  </Link>
                  <a
                    className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#4e45d5] px-10 py-5 text-sm font-bold uppercase tracking-wide text-[#4e45d5] transition-all duration-300 ease-in-out hover:border-[#4e45d5]/80 hover:bg-[#4e45d5]/10"
                    href="#how-it-works"
                    onClick={scrollToSection("how-it-works")}
                  >
                    How it works
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-[#e3dfff] opacity-20 blur-3xl" />
                <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-[#dbe2fa] opacity-20 blur-3xl" />
                <div className="soft-depth relative overflow-hidden rounded-[1.5rem] bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="AI-Powered Learning Interface" className="h-auto w-full rounded-2xl" src={HERO_IMAGE_URL} />
                  <div className="glass-accent soft-depth absolute right-8 top-8 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4e45d5] text-white">
                        <MaterialIcon fill>psychology</MaterialIcon>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#070235]">Adaptive Learning</p>
                        <p className="text-sm font-bold text-[#4e45d5]">Session Ongoing</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-screen scroll-mt-20 items-center overflow-hidden bg-white py-24 md:py-28" id="platform">
            <div className="mx-auto max-w-[1360px] px-4 md:px-12">
              <div className="grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
                <div className="relative order-2 lg:order-1">
                  <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-[#4e45d5]/10 blur-2xl" />
                  <div className="soft-depth relative flex aspect-[4/3] w-full flex-col overflow-hidden rounded-[2rem] bg-[#1e1b4b] p-10">
                    <div className="mb-8 flex gap-2 opacity-60">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-yellow-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                      <div className="ml-4 font-mono text-xs tracking-wider text-white/40">StridenextLearn</div>
                    </div>
                    <div className="flex flex-grow items-center justify-center text-center">
                      <div className="relative">
                        <span className="font-mono text-3xl leading-relaxed text-white md:text-4xl lg:text-5xl">{typedText || "StridenextLearn"}</span>
                        <span className="cursor-blink ml-2 inline-block h-10 w-3 align-middle bg-[#4e45d5] md:h-12" />
                      </div>
                    </div>
                    <div className="mt-auto flex items-end justify-between">
                      <div className="space-y-2">
                        <div className="h-1 w-24 rounded-full bg-white/10" />
                        <div className="h-1 w-16 rounded-full bg-white/10" />
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-white/20">System Active</div>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2">
                  <h2 className="mb-8 font-serif text-5xl font-bold leading-tight text-[#070235] md:text-6xl">The AI Tutor that thinks like a teacher</h2>
                  <div className="mb-12 space-y-7 text-xl leading-9 text-[#47464f]">
                    <p>
                      Most AI tools just answer your questions. StridenextLearn is built differently - it starts by assuming you are a beginner and builds
                      up your understanding layer by layer through guided questions and explanations.
                    </p>
                    <p>
                      We believe that education should be as unique as the person receiving it. Our platform identifies your specific strengths and hurdles
                      in real-time to build a path that works for you, not against you.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {[
                      ["psychology", "Any Subject", "No fixed curriculum - you choose"],
                      ["auto_fix_high", "Teaches First", "Never spoon-feeds answers"],
                      ["military_tech", "Expert-Grade Mastery", "Accelerating the journey from confused to confident."],
                    ].map(([icon, title, text]) => (
                      <div className="flex items-start gap-4" key={title}>
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#1e1b4b]/10">
                          <MaterialIcon className="text-3xl text-[#070235]" fill>
                            {icon}
                          </MaterialIcon>
                        </div>
                        <div>
                          <h4 className="mb-1 font-serif text-2xl font-bold text-[#070235]">{title}</h4>
                          <p className="text-base text-[#47464f]">{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-screen scroll-mt-20 flex-col justify-center overflow-hidden bg-[#f2f4f6] py-24 md:py-28" id="features">
            <div className="mx-auto mb-20 max-w-[1360px] px-4 text-center md:px-12">
              <h2 className="mb-5 font-serif text-5xl font-bold uppercase leading-tight text-[#070235] md:text-6xl">WHAT STRIDENEXTLEARN DOES</h2>
              <p className="mx-auto max-w-3xl text-xl leading-8 text-[#47464f]">Everything you need to master any subject</p>
            </div>
            <div className="marquee-mask relative w-full">
              <div className="animate-scroll flex w-max flex-nowrap gap-6">
                {[...FEATURES, ...FEATURES].map((feature, index) => (
                  <FeatureCard key={`${feature.title}-${index}`} {...feature} />
                ))}
              </div>
            </div>
          </section>

          <section className="flex min-h-screen scroll-mt-20 items-center bg-[#f7f9fb] py-24 md:py-28" id="how-it-works">
            <div className="mx-auto max-w-[1360px] px-4 md:px-12">
              <div className="mb-20 text-center">
                <h2 className="mb-5 font-serif text-5xl font-bold text-[#070235] md:text-6xl">How It Works</h2>
                <p className="mx-auto max-w-3xl text-xl leading-8 text-[#47464f]">Four steps from confused to confident - guided by AI that genuinely teaches.</p>
              </div>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                {STEPS.map((step, index) => (
                  <div className="group relative" key={step.title}>
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#1e1b4b] text-[#8683ba] shadow-sm transition-transform duration-300 group-hover:scale-110">
                        <MaterialIcon className="text-4xl" fill>
                          {step.icon}
                        </MaterialIcon>
                        <div className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#4e45d5] text-xs font-bold text-white">
                          {index + 1}
                        </div>
                      </div>
                      <h3 className="mb-5 font-serif text-3xl font-bold leading-tight text-[#070235]">{step.title}</h3>
                      <p className="text-lg leading-8 text-[#47464f]">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto flex min-h-screen max-w-[1360px] scroll-mt-20 flex-col justify-center px-4 py-24 md:px-12 md:py-28" id="testimonials">
            <div className="mb-16 flex flex-col items-end justify-between gap-8 md:flex-row">
              <div className="max-w-3xl">
                <h2 className="mb-5 font-serif text-5xl font-bold leading-tight text-[#070235] md:text-6xl">What Our Learners Are Saying</h2>
                <p className="text-xl leading-8 text-[#47464f]">Empowering students across the globe to reach their next milestone</p>
              </div>
              <div className="flex gap-2">
                <button className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c8c5d0] text-[#070235] transition-all hover:bg-[#e3dfff]" type="button">
                  <MaterialIcon>chevron_left</MaterialIcon>
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c8c5d0] text-[#070235] transition-all hover:bg-[#e3dfff]" type="button">
                  <MaterialIcon>chevron_right</MaterialIcon>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((testimonial) => (
                <div className="soft-depth flex flex-col justify-between rounded-2xl border border-[rgba(200,197,208,0.3)] bg-white p-10" key={testimonial.name}>
                  <div>
                    <div className="mb-4 flex text-[#4e45d5]">
                      {testimonial.rating.map((star, index) => (
                        <MaterialIcon fill key={`${testimonial.name}-${index}`}>
                          {star}
                        </MaterialIcon>
                      ))}
                    </div>
                    <p className="mb-10 text-lg italic leading-8 text-[#191c1e]">&quot;{testimonial.text}&quot;</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={testimonial.name} className="h-14 w-14 rounded-full object-cover" src={testimonial.image} />
                    <div>
                      <p className="text-base font-bold uppercase tracking-wide text-[#070235]">{testimonial.name}</p>
                      <p className="text-sm font-medium text-[#47464f]">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="relative flex min-h-screen items-center overflow-hidden py-24 md:py-28">
            <div className="absolute inset-0 z-0 bg-[#070235]" />
            <div
              className="absolute inset-0 z-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, #4e45d5 1px, transparent 0)",
                backgroundSize: "40px 40px",
              }}
            />
            <div className="relative z-10 mx-auto max-w-[1360px] px-4 text-center md:px-12">
              <h2 className="mb-7 font-serif text-5xl font-bold leading-tight text-white md:text-7xl">Ready to accelerate your learning?</h2>
              <p className="mx-auto mb-12 max-w-3xl text-xl leading-9 text-[#c4c1fb]/80">
                Join 50,000+ learners who are using StridenextLearn to master complex skills in half the time. Your first module is on us.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  className="rounded-2xl bg-[#4e45d5] px-10 py-5 text-sm font-bold uppercase tracking-wide text-white shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:scale-105 hover:brightness-110 active:scale-95"
                  href="/signup"
                >
                  Create Your Free Account
                </Link>
                <a className="font-semibold uppercase tracking-wide text-white underline underline-offset-8 transition-colors duration-300 ease-in-out hover:text-[#e3dfff]" href="#">
                  Compare our plans
                </a>
              </div>
            </div>
          </section>
        </main>

        <footer className="relative w-full scroll-mt-20 overflow-hidden border-t border-[rgba(200,197,208,0.3)] bg-white pb-12 pt-24 text-[#191c1e]" id="about">
          <div className="mx-auto max-w-[1200px] px-4 md:px-12">
            <div className="mb-20 grid grid-cols-1 gap-12 md:grid-cols-12">
              <div className="md:col-span-4">
                <div className="mb-6 font-serif text-2xl font-bold text-[#070235]">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="StridenextLearn Mark" className="h-12 w-auto object-contain" src={LOGO_URL} />
                    <span>StridenextLearn</span>
                  </div>
                </div>
                <p className="mb-8 max-w-xs text-base leading-6 text-[#47464f]">
                  Stay connected, explore courses, and study smarter. Your academic success starts here.
                </p>
                <div className="flex gap-5 text-[#47464f]">
                  {["public", "groups", "share", "alternate_email"].map((icon) => (
                    <a className="transition-colors hover:text-[#4e45d5]" href="#" key={icon}>
                      <MaterialIcon className="text-[20px]">{icon}</MaterialIcon>
                    </a>
                  ))}
                </div>
              </div>

              <div className="md:col-span-4">
                <h4 className="mb-8 text-xs font-bold uppercase tracking-[0.2em] text-[#070235]">Platform</h4>
                <ul className="space-y-4">
                  {["Home", "AI Tutor", "Exam Prep", "Pricing"].map((item) => (
                    <li key={item}>
                      <a className="text-sm font-medium text-[#47464f] transition-colors hover:text-[#4e45d5]" href="#">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-4">
                <h4 className="mb-8 text-xs font-bold uppercase tracking-[0.2em] text-[#070235]">Company</h4>
                <ul className="space-y-4">
                  {["About Us", "Support & FAQ", "Verify Certificate", "Privacy Policy", "Terms & Conditions"].map((item) => (
                    <li key={item}>
                      <a className="text-sm font-medium text-[#47464f] transition-colors hover:text-[#4e45d5]" href="#">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-[rgba(200,197,208,0.3)] pt-12 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#47464f]">ALL RIGHTS RESERVED 2026 - STRIDENEXTLEARN</p>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-[-10%] left-0 flex w-full select-none justify-center overflow-hidden opacity-[0.05]">
            <span className="whitespace-nowrap text-[24vw] font-bold tracking-tight text-[#070235]">StridenextLearn</span>
          </div>
        </footer>
      </div>
    </>
  );
}
