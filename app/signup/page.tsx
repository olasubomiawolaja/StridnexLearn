"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

const BENEFITS = [
  {
    title: "Adaptive tutoring",
    text: "explains more when you need it",
    icon: "psychology",
  },
  {
    title: "Auto-quizzes",
    text: "generated from what you've learned",
    icon: "bolt",
  },
  {
    title: "Private progress",
    text: "your learning profile stays yours",
    icon: "lock",
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

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <main className="signup-page min-h-screen bg-[#f7f9fb] px-6 text-[#070235]">
        <style jsx global>{`
          @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

          .signup-page {
            font-family: "Space Grotesk", sans-serif;
          }
        `}</style>
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center text-center">
          <Link href="/" className="mb-8 inline-flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4e45d5] shadow-[0_0_18px_rgba(78,69,213,0.9)]" />
            <span className="text-xl font-bold tracking-tight">StridenextLearn</span>
          </Link>

          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#4e45d5]/20 bg-[#e3dfff] text-[#4e45d5] shadow-sm">
            <MaterialIcon>mark_email_read</MaterialIcon>
          </div>
          <h1 className="mb-3 text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="mb-8 text-sm leading-6 text-[#47464f]">
            We sent a confirmation link to <strong className="text-[#070235]">{email}</strong>. Click the link to activate your account.
          </p>
          <Link className="rounded-2xl bg-[#4e45d5] px-6 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(78,69,213,0.22)] transition hover:brightness-110" href="/login">
            Go to Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="signup-page min-h-screen overflow-hidden bg-[#f7f9fb] text-[#070235]">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap");

        .signup-page {
          font-family: "Space Grotesk", sans-serif;
        }
      `}</style>
      <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-r border-[#c8c5d0]/50 bg-[#eef1f8] px-14 py-12 lg:flex">
          <div className="absolute right-[-18%] top-[-12%] h-80 w-80 rounded-full bg-[#4e45d5]/12 blur-3xl" />
          <div className="absolute bottom-[18%] left-[-18%] h-80 w-80 rounded-full bg-[#c4c1fb]/35 blur-3xl" />

          <Link href="/" className="relative z-10 flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#4e45d5] shadow-[0_0_18px_rgba(78,69,213,0.9)]" />
            <span className="text-3xl font-extrabold tracking-tight">StridenextLearn</span>
          </Link>

          <div className="relative z-10 max-w-xl">
            <p className="mb-7 inline-flex rounded-full border border-[#4e45d5]/15 bg-[#e3dfff] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#4e45d5]">
              AI-powered adaptive tutoring
            </p>
            <h1 className="mb-8 text-5xl font-extrabold leading-[1.08] tracking-tight xl:text-6xl">
              Start your <span className="bg-gradient-to-r from-[#c4c1fb] to-[#4e45d5] bg-clip-text text-transparent">personalized learning</span> journey today.
            </h1>
            <p className="mb-12 max-w-lg text-lg leading-8 text-[#47464f]">
              Join StridenextLearn and get an AI tutor that teaches first, adapts to your pace, and helps you master any subject with clarity.
            </p>

            <div className="space-y-5">
              {BENEFITS.map((benefit) => (
                <div className="flex items-center gap-4" key={benefit.title}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#4e45d5]/15 bg-white text-[#4e45d5] shadow-sm">
                    <MaterialIcon>{benefit.icon}</MaterialIcon>
                  </div>
                  <p className="text-base text-[#47464f]">
                    <span className="font-bold text-[#070235]">{benefit.title}</span> - {benefit.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-sm text-[#47464f]">© 2026 StridenextLearn. All rights reserved.</p>
        </aside>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-16">
          <div className="w-full max-w-xl">
            <Link href="/" className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4e45d5] shadow-[0_0_18px_rgba(78,69,213,0.9)]" />
              <span className="text-2xl font-extrabold tracking-tight">StridenextLearn</span>
            </Link>

            <div className="mb-10">
              <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-[#070235]">Create account</h1>
              <p className="text-base text-[#47464f]">
                Already have an account?{" "}
                <Link className="font-semibold text-[#4e45d5] transition hover:text-[#070235]" href="/login">
                  Log in
                </Link>
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="mb-2 block text-sm font-semibold text-[#5b598c]">
                  Full name *
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="h-14 w-full rounded-xl border border-[#c8c5d0]/55 bg-white px-5 text-base text-[#070235] shadow-sm outline-none transition placeholder:text-[#787680] focus:border-[#4e45d5] focus:ring-4 focus:ring-[#4e45d5]/15"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#5b598c]">
                  Email address *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="h-14 w-full rounded-xl border border-[#c8c5d0]/55 bg-white px-5 text-base text-[#070235] shadow-sm outline-none transition placeholder:text-[#787680] focus:border-[#4e45d5] focus:ring-4 focus:ring-[#4e45d5]/15"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#5b598c]">
                  Password *
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="h-14 w-full rounded-xl border border-[#c8c5d0]/55 bg-white px-5 text-base text-[#070235] shadow-sm outline-none transition placeholder:text-[#787680] focus:border-[#4e45d5] focus:ring-4 focus:ring-[#4e45d5]/15"
                />
              </div>

              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="h-15 w-full rounded-2xl bg-[#4e45d5] px-6 py-4 text-base font-extrabold text-white shadow-[0_20px_50px_rgba(78,69,213,0.25)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
