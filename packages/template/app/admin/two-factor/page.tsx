"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function TwoFactorPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [trustDevice, setTrustDevice] = useState(true);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "backup") {
      const { error } = await authClient.twoFactor.verifyBackupCode({
        code,
      });

      if (error) {
        setError(error.message ?? "Invalid backup code.");
        setLoading(false);
        return;
      }
    } else {
      const { error } = await authClient.twoFactor.verifyTotp({
        code,
        trustDevice,
      });

      if (error) {
        setError(error.message ?? "Invalid code. Try again.");
        setLoading(false);
        return;
      }
    }

    router.push("/admin");
  }

  return (
    <main className="bg-t-dark min-h-screen scanlines flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">sudo authenticate --2fa</span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)] mb-4">
          two-factor<span className="text-t-accent glow">.</span>
        </h1>

        <p className="font-sans text-sm text-t-surface/50 mb-8">
          {mode === "totp"
            ? "Enter the 6-digit code from your authenticator app."
            : "Enter one of your backup codes."}
        </p>

        {error && (
          <div className="border border-t-accent-alt/40 bg-t-accent-alt/10 p-4 mb-6">
            <p className="font-mono text-t-accent-alt text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "totp" ? (
            <input
              type="text"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-2xl text-center tracking-[0.3em] focus:border-t-accent focus:outline-none transition-colors"
              autoFocus
            />
          ) : (
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="backup code"
              className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
              autoFocus
            />
          )}

          {mode === "totp" && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                className="accent-t-accent"
              />
              <span className="font-mono text-[0.7rem] text-t-surface/50">
                trust this device for 30 days
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading || (mode === "totp" && code.length !== 6)}
            className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "verifying..." : "verify"}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={() => {
              setMode(mode === "totp" ? "backup" : "totp");
              setCode("");
              setError("");
            }}
            className="font-mono text-[0.68rem] lowercase text-t-surface/50 hover:text-t-accent transition-colors"
          >
            {mode === "totp"
              ? "use a backup code instead"
              : "use authenticator app"}
          </button>
        </div>
      </div>
    </main>
  );
}
