"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles, Check } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const { signup, isFirebaseConnected } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
      // New user created -> Proceed to company & voice onboarding setup
      router.push("/setup");
    } catch (err: any) {
      // If user already exists, redirect to login as requested!
      if (err.message === "USER_EXISTS" || err.code === "auth/email-already-in-use") {
        setError("Account already exists with this email! Redirecting to Log in...");
        setTimeout(() => {
          router.push(`/login?email=${encodeURIComponent(email)}`);
        }, 1200);
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <BlurFade delay={0.05}>
          <div className="text-center space-y-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-accent text-surface flex items-center justify-center font-heading font-bold text-xl shadow-xs">
                V
              </div>
              <span className="font-heading text-2xl font-bold tracking-tight text-ink">
                Vaani Recap
              </span>
            </Link>
            <h1 className="text-2xl font-heading text-ink">Create your account</h1>
            <p className="text-xs text-muted">
              Start capturing sales calls with Gnani Prisma and Timbre
            </p>
          </div>
        </BlurFade>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <BlurFade delay={0.1}>
          <div className="bg-surface border border-border py-8 px-6 sm:px-10 rounded-lg paper-shadow space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3 top-3" strokeWidth={1.5} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@business.com"
                    className="w-full bg-paper border border-border rounded-md pl-9 pr-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                  Set password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3 top-3" strokeWidth={1.5} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-paper border border-border rounded-md pl-9 pr-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3 top-3" strokeWidth={1.5} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-paper border border-border rounded-md pl-9 pr-3 py-2 text-sm text-ink focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent text-surface py-2.5 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs mt-3"
              >
                {loading ? "Creating account..." : "Sign up & proceed to setup"}
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </form>

            <div className="pt-4 border-t border-border text-center text-xs text-muted">
              Already have an account?{" "}
              <Link href="/login" className="text-accent hover:underline font-medium">
                Log in
              </Link>
            </div>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper flex items-center justify-center text-xs text-muted">Loading sign up...</div>}>
      <SignUpForm />
    </Suspense>
  );
}

