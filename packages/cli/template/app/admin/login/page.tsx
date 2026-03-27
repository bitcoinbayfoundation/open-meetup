"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/admin/reset-password",
      });
      if (error) {
        setError(error.message ?? "Something went wrong.");
      } else {
        setInfo("Check your email for a password reset link.");
      }
      setLoading(false);
      return;
    }

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      if (error.status === 403) {
        setError(
          "Email not verified. Check your inbox for a verification link.",
        );
        setShowResendVerification(true);
      } else {
        setError(error.message ?? "Invalid credentials.");
      }
      setLoading(false);
      return;
    }

    // If 2FA is enabled, twoFactorClient plugin auto-redirects to /admin/two-factor
    // Otherwise, go to dashboard (which will redirect to /admin/setup-2fa if 2FA not set up)
    router.push("/admin");
  }

  return (
    <main className="bg-t-dark min-h-screen scanlines flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">ssh admin@bitcoinbay</span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)] mb-10">
          {mode === "forgot" ? "reset" : "admin"}
          <span className="text-t-accent glow">.</span>
        </h1>

        {error && (
          <div className="border border-t-accent-alt/40 bg-t-accent-alt/10 p-4 mb-6">
            <p className="font-mono text-t-accent-alt text-sm">{error}</p>
            {showResendVerification && email && (
              <button
                onClick={async () => {
                  setResending(true);
                  await authClient.sendVerificationEmail({
                    email,
                    callbackURL: "/admin",
                  });
                  setResending(false);
                  setError("");
                  setShowResendVerification(false);
                  setInfo("Verification email sent. Check your inbox.");
                }}
                disabled={resending}
                className="mt-3 font-mono text-[0.68rem] lowercase text-t-accent hover:text-t-surface transition-colors disabled:opacity-50"
              >
                {resending ? "sending..." : "resend verification email"}
              </button>
            )}
          </div>
        )}

        {info && (
          <div className="border border-t-accent/40 bg-t-accent/10 p-4 mb-6">
            <p className="font-mono text-t-accent text-sm">{info}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email"
            className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
          />
          {mode === "login" && (
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
          >
            {loading
              ? mode === "forgot"
                ? "sending..."
                : "authenticating..."
              : mode === "forgot"
                ? "send reset link"
                : "sign in"}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={() => {
              setMode(mode === "login" ? "forgot" : "login");
              setError("");
              setInfo("");
            }}
            className="font-mono text-[0.68rem] lowercase text-t-surface/50 hover:text-t-accent transition-colors text-left"
          >
            {mode === "login" ? "forgot password?" : "back to sign in"}
          </button>
          {mode === "login" && (
            <Link
              href="/admin/signup"
              className="font-mono text-[0.68rem] lowercase text-t-surface/50 hover:text-t-accent transition-colors"
            >
              need an account? sign up
            </Link>
          )}
        </div>

        <div className="mt-8 font-mono text-[0.6rem] text-t-surface/30">
          <span className="text-t-accent/50">$</span> authorized personnel
          only_
        </div>
      </div>
    </main>
  );
}
