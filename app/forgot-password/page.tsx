"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Mail, ArrowRight, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const { resetPassword } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      if (err.message === "USER_NOT_FOUND" || err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else {
        setError(err.message || "Failed to send reset link. Please check the email entered.");
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
            <h1 className="text-2xl font-heading text-ink">Reset password</h1>
            <p className="text-xs text-muted">
              Enter your registered email to receive a password recovery link
            </p>
          </div>
        </BlurFade>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <BlurFade delay={0.1}>
          <div className="bg-surface border border-border py-8 px-6 sm:px-10 rounded-lg paper-shadow space-y-6">
            {submitted ? (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/15 text-secondary border border-secondary/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading text-lg text-ink">Reset link sent!</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    We&apos;ve sent a password reset link to <strong className="text-ink">{email}</strong>. Check your inbox and click the link to set a new password.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> Back to log in
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.5} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-muted font-medium block">
                      Registered email address
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent text-surface py-2.5 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs mt-3"
                  >
                    {loading ? "Sending reset link..." : "Send reset link"}
                    <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </form>

                <div className="pt-4 border-t border-border text-center text-xs text-muted">
                  Remember your password?{" "}
                  <Link href="/login" className="text-accent hover:underline font-medium">
                    Log in
                  </Link>
                </div>
              </>
            )}
          </div>
        </BlurFade>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper flex items-center justify-center text-xs text-muted">Loading reset page...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

