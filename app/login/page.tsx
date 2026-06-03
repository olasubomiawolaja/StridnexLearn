"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const TESTIMONIALS = [
  {
    quote:
      "StridenextLearn doesn't just give me answers - it actually teaches me. The adaptive quizzes caught gaps I didn't even know I had.",
    name: "Subomi",
    course: "Physics & Mathematics",
    initials: "S",
  },
  {
    quote:
      "I came back after a week and the tutor remembered exactly where I struggled. It made revision feel organized instead of overwhelming.",
    name: "Amara",
    course: "Chemistry & Biology",
    initials: "A",
  },
  {
    quote:
      "The explanations adjust to my pace. When I understand quickly, it moves faster. When I don't, it slows down without making me feel stuck.",
    name: "David",
    course: "Coding & Statistics",
    initials: "D",
  },
  {
    quote:
      "The learning map helps me see what I have mastered and what still needs work. It feels like a personal coach for every subject.",
    name: "Fatima",
    course: "English & Exam Prep",
    initials: "F",
  },
];

function MaterialIcon({ children }: { children: string }) {
  return (
    <span
      className="material-symbols-outlined text-[22px]"
      style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }}
    >
      {children}
    </span>
  );
}

function AuthStyles() {
  return (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

      .login-page {
        font-family: "Space Grotesk", sans-serif;
      }
    `}</style>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="flex items-center gap-3" href="/">
      <span className="h-2.5 w-2.5 rounded-full bg-[#4e45d5] shadow-[0_0_18px_rgba(78,69,213,0.9)]" />
      <span className={`${compact ? "text-2xl" : "text-3xl"} font-extrabold tracking-tight text-[#070235]`}>StridenextLearn</span>
    </Link>
  );
}

function StoryPanel({ testimonial }: { testimonial: (typeof TESTIMONIALS)[number] }) {
  return (
    <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-l border-[#c8c5d0]/50 bg-[#eef1f8] px-14 py-12 lg:flex">
      <div className="absolute right-[-18%] top-[-12%] h-80 w-80 rounded-full bg-[#4e45d5]/12 blur-3xl" />
      <div className="absolute bottom-[18%] left-[-18%] h-80 w-80 rounded-full bg-[#c4c1fb]/35 blur-3xl" />

      <div className="relative z-10">
        <BrandMark />
      </div>

      <div className="relative z-10 max-w-2xl">
        <p className="mb-7 inline-flex rounded-full border border-[#4e45d5]/15 bg-[#e3dfff] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#4e45d5]">
          Continue your learning path
        </p>
        <h1 className="mb-8 text-5xl font-extrabold leading-[1.08] tracking-tight xl:text-6xl">
          Welcome back to <span className="bg-gradient-to-r from-[#c4c1fb] to-[#4e45d5] bg-clip-text text-transparent">StridenextLearn.</span>
        </h1>
        <p className="mb-12 max-w-xl text-lg leading-8 text-[#47464f]">
          Your AI tutor keeps track of your progress, weak spots, and recent lessons so you can pick up exactly where you left off.
        </p>

        <div className="rounded-3xl border border-[#c8c5d0]/55 bg-white/85 p-8 shadow-[0_24px_70px_rgba(7,2,53,0.08)]">
          <p className="mb-7 text-xl font-medium italic leading-8 text-[#070235]">&quot;{testimonial.quote}&quot;</p>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4e45d5] text-base font-extrabold text-white shadow-[0_12px_30px_rgba(78,69,213,0.25)]">
              {testimonial.initials}
            </div>
            <div>
              <p className="font-bold text-[#070235]">{testimonial.name}</p>
              <p className="text-sm text-[#5b598c]">{testimonial.course}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="relative z-10 text-sm text-[#47464f]">© 2026 StridenextLearn. All rights reserved.</p>
    </aside>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const router = useRouter();
  const testimonial = TESTIMONIALS[testimonialIndex];

  useEffect(() => {
    const randomizeTestimonial = window.setTimeout(() => {
      setTestimonialIndex(Math.floor(Math.random() * TESTIMONIALS.length));
    }, 0);

    return () => window.clearTimeout(randomizeTestimonial);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email) {
      setError("Enter your email address first.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setResetSent(true);
    setLoading(false);
  };

  if (resetSent) {
    return (
      <main className="login-page min-h-screen bg-[#f7f9fb] px-6 text-[#070235]">
        <AuthStyles />
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center text-center">
          <div className="mb-8">
            <BrandMark compact />
          </div>
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#4e45d5]/20 bg-[#e3dfff] text-[#4e45d5] shadow-sm">
            <MaterialIcon>mark_email_read</MaterialIcon>
          </div>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight">Check your email</h1>
          <p className="mb-8 text-sm leading-6 text-[#47464f]">
            We sent a password reset link to <strong className="text-[#070235]">{email}</strong>.
          </p>
          <button
            onClick={() => {
              setResetSent(false);
              setShowForgot(false);
            }}
            className="rounded-2xl bg-[#4e45d5] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(78,69,213,0.22)] transition hover:brightness-110"
            type="button"
          >
            Back to Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="login-page min-h-screen overflow-hidden bg-[#f7f9fb] text-[#070235]">
      <AuthStyles />
      <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-16">
          <div className="w-full max-w-xl">
            <div className="mb-10 lg:hidden">
              <BrandMark compact />
            </div>

            {showForgot ? (
              <>
                <div className="mb-10">
                  <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-[#070235]">Reset password</h1>
                  <p className="text-base text-[#47464f]">Enter your email and we&apos;ll send you a reset link.</p>
                </div>

                <form className="space-y-6" onSubmit={handleForgotPassword}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#5b598c]" htmlFor="resetEmail">
                      Email address
                    </label>
                    <input
                      className="h-14 w-full rounded-xl border border-[#c8c5d0]/55 bg-white px-5 text-base text-[#070235] shadow-sm outline-none transition placeholder:text-[#787680] focus:border-[#4e45d5] focus:ring-4 focus:ring-[#4e45d5]/15"
                      id="resetEmail"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                      type="email"
                      value={email}
                    />
                  </div>

                  {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

                  <button
                    className="w-full rounded-2xl bg-[#4e45d5] px-6 py-4 text-base font-extrabold text-white shadow-[0_20px_50px_rgba(78,69,213,0.25)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Sending..." : "Send reset link"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#47464f]">
                  <button
                    className="font-semibold text-[#4e45d5] transition hover:text-[#070235]"
                    onClick={() => {
                      setShowForgot(false);
                      setError("");
                    }}
                    type="button"
                  >
                    Back to Sign In
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="mb-10">
                  <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-[#070235]">Log in</h1>
                  <p className="text-base text-[#47464f]">
                    Don&apos;t have an account?{" "}
                    <Link className="font-semibold text-[#4e45d5] transition hover:text-[#070235]" href="/signup">
                      Sign up free
                    </Link>
                  </p>
                </div>

                <form className="space-y-6" onSubmit={handleLogin}>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#5b598c]" htmlFor="email">
                      Email address
                    </label>
                    <input
                      className="h-14 w-full rounded-xl border border-[#c8c5d0]/55 bg-white px-5 text-base text-[#070235] shadow-sm outline-none transition placeholder:text-[#787680] focus:border-[#4e45d5] focus:ring-4 focus:ring-[#4e45d5]/15"
                      id="email"
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      required
                      type="email"
                      value={email}
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-semibold text-[#5b598c]" htmlFor="password">
                        Password
                      </label>
                      <button
                        className="text-sm font-semibold text-[#4e45d5] transition hover:text-[#070235]"
                        onClick={() => {
                          setShowForgot(true);
                          setError("");
                        }}
                        type="button"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        className="h-14 w-full rounded-xl border border-[#c8c5d0]/55 bg-white px-5 pr-14 text-base text-[#070235] shadow-sm outline-none transition placeholder:text-[#787680] focus:border-[#4e45d5] focus:ring-4 focus:ring-[#4e45d5]/15"
                        id="password"
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                      />
                      <button
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-[#787680] transition hover:text-[#4e45d5]"
                        onClick={() => setShowPassword((current) => !current)}
                        type="button"
                      >
                        <MaterialIcon>{showPassword ? "visibility_off" : "visibility"}</MaterialIcon>
                      </button>
                    </div>
                  </div>

                  {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

                  <button
                    className="w-full rounded-2xl bg-[#4e45d5] px-6 py-4 text-base font-extrabold text-white shadow-[0_20px_50px_rgba(78,69,213,0.25)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? "Signing in..." : "Log in"}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>

        <StoryPanel testimonial={testimonial} />
      </div>
    </main>
  );
}
