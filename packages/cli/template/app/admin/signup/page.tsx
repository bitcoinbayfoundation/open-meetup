"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.endsWith("@bitcoinbay.foundation")) {
      setError("Sign-up is restricted to @bitcoinbay.foundation emails.");
      return;
    }

    setLoading(true);

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (error) {
      setError(error.message ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="bg-t-dark min-h-screen scanlines flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">useradd --admin</span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)] mb-10">
          sign up<span className="text-t-accent glow">.</span>
        </h1>

        {error && (
          <div className="border border-t-accent-alt/40 bg-t-accent-alt/10 p-4 mb-6">
            <p className="font-mono text-t-accent-alt text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name"
            className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@bitcoinbay.foundation"
            className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password (min 8 chars)"
            className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "creating account..." : "create account"}
          </button>
        </form>

        <div className="mt-6">
          <Link
            href="/admin/login"
            className="font-mono text-[0.68rem] lowercase text-t-surface/50 hover:text-t-accent transition-colors"
          >
            already have an account? sign in
          </Link>
        </div>

        <div className="mt-8 font-mono text-[0.6rem] text-t-surface/30">
          <span className="text-t-accent/50">$</span> @bitcoinbay.foundation
          emails only_
        </div>
      </div>
    </main>
  );
}
