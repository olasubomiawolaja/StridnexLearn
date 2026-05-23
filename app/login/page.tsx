"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const router = useRouter();

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
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center text-sm font-bold text-white mx-auto mb-6">
            SL
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-3">
            Check your email
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            We sent a password reset link to <strong>{email}</strong>.
          </p>
          <button
            onClick={() => {
              setResetSent(false);
              setShowForgot(false);
            }}
            className="text-sm text-gray-900 font-medium hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      </main>
    );
  }

  if (showForgot) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="flex items-center gap-2 justify-center mb-8"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-xs font-bold text-white">
              SL
            </div>
            <span className="font-semibold text-lg tracking-tight">
              StridenexLearn
            </span>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-center mb-1">
            Reset your password
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label
                htmlFor="resetEmail"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email address
              </label>
              <input
                id="resetEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            <button
              onClick={() => {
                setShowForgot(false);
                setError("");
              }}
              className="text-gray-900 font-medium hover:underline"
            >
              Back to Sign In
            </button>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-xs font-bold text-white">
            SL
          </div>
          <span className="font-semibold text-lg tracking-tight">
            StridenexLearn
          </span>
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-center mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Sign in to continue learning.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setError("");
                }}
                className="text-xs text-gray-500 hover:text-gray-900"
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-gray-900 font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
