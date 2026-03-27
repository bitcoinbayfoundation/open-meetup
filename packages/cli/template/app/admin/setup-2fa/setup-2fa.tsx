"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

export default function Setup2FA() {
  const router = useRouter();
  const [step, setStep] = useState<"password" | "qr" | "verify">("password");
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleEnable(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await authClient.twoFactor.enable({
      password,
    });

    if (error) {
      setError(error.message ?? "Failed to enable 2FA.");
      setLoading(false);
      return;
    }

    if (data?.backupCodes) {
      setBackupCodes(data.backupCodes);
    }

    // Now get the TOTP URI for the QR code
    const uriRes = await authClient.twoFactor.getTotpUri({
      password,
    });

    if (uriRes.error) {
      setError(uriRes.error.message ?? "Failed to get QR code.");
      setLoading(false);
      return;
    }

    if (uriRes.data?.totpURI) {
      setTotpURI(uriRes.data.totpURI);
      // Extract the secret from the URI
      const secretMatch = uriRes.data.totpURI.match(/secret=([A-Z2-7]+)/);
      if (secretMatch) setSecret(secretMatch[1]);
    }

    setStep("qr");
    setLoading(false);
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await authClient.twoFactor.verifyTotp({
      code,
    });

    if (error) {
      setError(error.message ?? "Invalid code. Try again.");
      setLoading(false);
      return;
    }

    router.push("/admin");
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="bg-t-dark min-h-screen scanlines flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">
            ssh-keygen -t totp --2fa
          </span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)] mb-4">
          set up 2fa<span className="text-t-accent glow">.</span>
        </h1>

        <p className="font-sans text-sm text-t-surface/50 mb-8">
          Two-factor authentication is required to access the admin dashboard.
          You&apos;ll need an authenticator app like Google Authenticator, Authy,
          or 1Password.
        </p>

        {error && (
          <div className="border border-t-accent-alt/40 bg-t-accent-alt/10 p-4 mb-6">
            <p className="font-mono text-t-accent-alt text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Enter password to enable */}
        {step === "password" && (
          <form onSubmit={handleEnable} className="flex flex-col gap-4">
            <p className="font-mono text-[0.7rem] text-t-surface/60">
              Enter your password to begin setup.
            </p>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="your password"
              className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "setting up..." : "continue"}
            </button>
          </form>
        )}

        {/* Step 2: Show QR code */}
        {step === "qr" && (
          <div className="flex flex-col gap-6">
            <p className="font-mono text-[0.7rem] text-t-surface/60">
              Scan this QR code with your authenticator app.
            </p>

            {totpURI && (
              <div className="flex justify-center p-6 bg-white">
                <QRCodeSVG value={totpURI} size={200} />
              </div>
            )}

            {secret && (
              <div className="border border-t-surface/10 p-4">
                <p className="font-mono text-[0.6rem] text-t-surface/40 mb-2">
                  can&apos;t scan? enter this key manually:
                </p>
                <div className="flex items-center gap-3">
                  <code className="font-mono text-sm text-t-accent break-all flex-1">
                    {secret}
                  </code>
                  <button
                    onClick={copySecret}
                    className="font-mono text-[0.6rem] text-t-surface/50 hover:text-t-accent transition-colors shrink-0"
                  >
                    {copied ? "copied" : "copy"}
                  </button>
                </div>
              </div>
            )}

            {backupCodes.length > 0 && (
              <div className="border border-t-accent/20 bg-t-accent/5 p-4">
                <p className="font-mono text-[0.65rem] text-t-accent mb-3">
                  save these backup codes somewhere safe. you can use them if you
                  lose access to your authenticator.
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {backupCodes.map((code) => (
                    <code
                      key={code}
                      className="font-mono text-[0.75rem] text-t-surface/70"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep("verify")}
              className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
            >
              i&apos;ve saved my codes
            </button>
          </div>
        )}

        {/* Step 3: Verify code */}
        {step === "verify" && (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <p className="font-mono text-[0.7rem] text-t-surface/60">
              Enter the 6-digit code from your authenticator to confirm setup.
            </p>
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
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "verifying..." : "verify & activate"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
