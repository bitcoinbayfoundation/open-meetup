"use client";

import { Suspense, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token: token ?? "",
    });

    if (error) {
      setError(error.message ?? "Failed to reset password.");
      setLoading(false);
      return;
    }

    router.push("/admin/login");
  }

  return (
    <>
      <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
        <span className="text-t-accent">$</span>{" "}
        <span className="text-t-surface/70">passwd --reset</span>
      </div>

      <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)] mb-10">
        new password<span className="text-t-accent glow">.</span>
      </h1>

      {error && (
        <div className="border border-t-accent-alt/40 bg-t-accent-alt/10 p-4 mb-6">
          <p className="font-mono text-t-accent-alt text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="new password (min 8 chars)"
          className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
        />
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="confirm password"
          className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={loading}
          className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
        >
          {loading ? "resetting..." : "set new password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="bg-t-dark min-h-screen scanlines flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <Suspense
          fallback={
            <p className="font-mono text-sm text-t-surface/40">
              loading...
            </p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
