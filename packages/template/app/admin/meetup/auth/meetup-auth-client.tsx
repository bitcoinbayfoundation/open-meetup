"use client";

import { useState, useEffect } from "react";

interface TokenResult {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export default function MeetupAuthClient({
  clientId,
  hasClientId,
  hasClientSecret,
}: {
  clientId: string;
  hasClientId: boolean;
  hasClientSecret: boolean;
}) {
  const [step, setStep] = useState<"prereqs" | "authorize" | "exchange" | "done">("prereqs");
  const [code, setCode] = useState("");
  const [tokens, setTokens] = useState<TokenResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/admin/meetup/auth` : "";
  const authorizeUrl = `https://secure.meetup.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;

  // Check for code in URL on mount (callback from Meetup)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get("code");
    if (urlCode) {
      setCode(urlCode);
      setStep("exchange");
      // Clean the URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (hasClientId && hasClientSecret) {
      setStep("authorize");
    }
  }, [hasClientId, hasClientSecret]);

  async function exchangeCode() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/meetup/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTokens(data);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Exchange failed");
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <main className="min-h-screen bg-t-dark pt-28 pb-24 px-6 lg:px-12">
      <div className="max-w-[700px] mx-auto">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span> meetup-oauth --setup
        </div>
        <h1 className="font-mono font-bold lowercase text-t-surface text-3xl mb-4">
          meetup auth<span className="text-t-accent">.</span>
        </h1>
        <p className="font-sans text-t-surface/60 mb-8 max-w-[55ch]">
          Connect your Meetup.com account to sync events. This page handles the OAuth token exchange.
        </p>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-10">
          {["prereqs", "authorize", "exchange", "done"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 border-t border-t-surface/20" />}
              <div
                className={`w-8 h-8 flex items-center justify-center font-mono text-[0.7rem] font-bold border ${
                  step === s
                    ? "border-t-accent text-t-accent bg-t-accent/10"
                    : ["prereqs", "authorize", "exchange", "done"].indexOf(step) > i
                      ? "border-green-500/40 text-green-400 bg-green-500/10"
                      : "border-t-surface/20 text-t-surface/30"
                }`}
              >
                {["prereqs", "authorize", "exchange", "done"].indexOf(step) > i ? "✓" : i + 1}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="border border-red-500/40 bg-red-500/10 p-4 mb-6">
            <p className="font-mono text-[0.8rem] text-red-400">{error}</p>
          </div>
        )}

        {/* Step 1: Prerequisites */}
        {step === "prereqs" && (
          <div className="space-y-6">
            <div className="border border-t-surface/10 p-6">
              <h2 className="font-mono text-sm font-bold text-t-surface mb-4">
                1. set environment variables
              </h2>
              <p className="font-sans text-[0.85rem] text-t-surface/60 mb-4">
                Before connecting Meetup, you need to register an OAuth consumer at{" "}
                <a
                  href="https://www.meetup.com/api/oauth/list/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-t-accent hover:text-t-surface transition-colors"
                >
                  meetup.com/api/oauth/list
                </a>{" "}
                and add the credentials to your Vercel environment variables.
              </p>

              <div className="space-y-3">
                <EnvStatus label="MEETUP_CLIENT_ID" set={hasClientId} />
                <EnvStatus label="MEETUP_CLIENT_SECRET" set={hasClientSecret} />
              </div>

              <div className="mt-6 p-4 bg-t-surface/5 border border-t-surface/10">
                <p className="font-mono text-[0.7rem] text-t-surface/50 mb-2">redirect uri for meetup oauth:</p>
                <code className="font-mono text-[0.8rem] text-t-accent break-all">
                  {redirectUri || "loading..."}
                </code>
                <p className="font-sans text-[0.7rem] text-t-surface/40 mt-2">
                  Use this as the redirect URI when registering your Meetup OAuth consumer.
                </p>
              </div>

              {hasClientId && hasClientSecret ? (
                <button
                  onClick={() => setStep("authorize")}
                  className="mt-6 font-mono text-[0.75rem] font-semibold lowercase bg-t-accent text-t-surface px-6 py-3 hover:bg-t-surface hover:text-t-dark transition-all cursor-pointer"
                >
                  continue →
                </button>
              ) : (
                <p className="mt-6 font-mono text-[0.75rem] text-amber-400">
                  Set both environment variables in Vercel, redeploy, and refresh this page.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Authorize */}
        {step === "authorize" && (
          <div className="space-y-6">
            <div className="border border-t-surface/10 p-6">
              <h2 className="font-mono text-sm font-bold text-t-surface mb-4">
                2. authorize with meetup
              </h2>
              <p className="font-sans text-[0.85rem] text-t-surface/60 mb-6">
                Click the button below to authorize your Meetup account. You{"'"}ll be redirected to
                Meetup.com to grant access, then sent back here with an authorization code.
              </p>
              <a
                href={authorizeUrl}
                className="inline-block font-mono text-[0.75rem] font-semibold lowercase bg-t-accent text-t-surface px-6 py-3 hover:bg-t-surface hover:text-t-dark transition-all"
              >
                authorize on meetup.com →
              </a>
            </div>

            <div className="border border-t-surface/10 p-6">
              <p className="font-mono text-[0.7rem] text-t-surface/50 mb-3">or paste code manually:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="authorization code"
                  className="flex-1 bg-t-surface/5 border border-t-surface/15 px-4 py-2.5 text-t-surface placeholder:text-t-surface/30 font-mono text-[0.8rem] focus:border-t-accent focus:outline-none"
                />
                <button
                  onClick={() => code && setStep("exchange")}
                  disabled={!code}
                  className="font-mono text-[0.72rem] font-semibold lowercase bg-t-accent text-t-surface px-5 py-2.5 hover:bg-t-surface hover:text-t-dark transition-all cursor-pointer disabled:opacity-40"
                >
                  next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Exchange */}
        {step === "exchange" && (
          <div className="border border-t-surface/10 p-6">
            <h2 className="font-mono text-sm font-bold text-t-surface mb-4">
              3. exchange code for tokens
            </h2>
            <p className="font-sans text-[0.85rem] text-t-surface/60 mb-4">
              Authorization code received. Click below to exchange it for access and refresh tokens.
            </p>

            <div className="bg-t-surface/5 border border-t-surface/10 p-3 mb-6">
              <p className="font-mono text-[0.7rem] text-t-surface/40">code:</p>
              <p className="font-mono text-[0.8rem] text-t-accent break-all">{code}</p>
            </div>

            <button
              onClick={exchangeCode}
              disabled={loading}
              className="font-mono text-[0.75rem] font-semibold lowercase bg-t-accent text-t-surface px-6 py-3 hover:bg-t-surface hover:text-t-dark transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "exchanging..." : "exchange for tokens →"}
            </button>
          </div>
        )}

        {/* Step 4: Done */}
        {step === "done" && tokens && (
          <div className="space-y-6">
            <div className="border border-green-500/30 bg-green-500/10 p-6">
              <h2 className="font-mono text-sm font-bold text-green-400 mb-2">
                tokens received
              </h2>
              <p className="font-sans text-[0.85rem] text-t-surface/60">
                Add these as environment variables in your Vercel project, then redeploy.
              </p>
            </div>

            <TokenDisplay
              label="MEETUP_OAUTH_TOKEN"
              value={tokens.access_token}
              copied={copied === "access"}
              onCopy={() => copyToClipboard(tokens.access_token, "access")}
            />
            <TokenDisplay
              label="MEETUP_OAUTH_REFRESH_TOKEN"
              value={tokens.refresh_token}
              copied={copied === "refresh"}
              onCopy={() => copyToClipboard(tokens.refresh_token, "refresh")}
            />

            <div className="bg-t-surface/5 border border-t-surface/10 p-4">
              <p className="font-mono text-[0.7rem] text-t-surface/40 mb-1">token type: {tokens.token_type}</p>
              <p className="font-mono text-[0.7rem] text-t-surface/40">expires in: {tokens.expires_in} seconds</p>
            </div>

            <div className="border border-t-surface/10 p-6">
              <h3 className="font-mono text-[0.8rem] font-bold text-t-surface mb-3">next steps</h3>
              <ol className="list-decimal list-inside space-y-2 font-sans text-[0.85rem] text-t-surface/60">
                <li>Go to Vercel → Settings → Environment Variables</li>
                <li>Add <code className="font-mono text-t-accent text-[0.8rem]">MEETUP_OAUTH_TOKEN</code> with the access token</li>
                <li>Add <code className="font-mono text-t-accent text-[0.8rem]">MEETUP_OAUTH_REFRESH_TOKEN</code> with the refresh token</li>
                <li>Redeploy your site</li>
                <li>Set <code className="font-mono text-t-accent text-[0.8rem]">meetup.groupSlug</code> in site.config.ts if not already set</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function EnvStatus({ label, set }: { label: string; set: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`font-mono text-[0.7rem] font-bold ${set ? "text-green-400" : "text-amber-400"}`}>
        {set ? "✓" : "✗"}
      </span>
      <code className="font-mono text-[0.8rem] text-t-surface/70">{label}</code>
      <span className={`font-mono text-[0.6rem] ${set ? "text-green-400/60" : "text-amber-400/60"}`}>
        {set ? "configured" : "missing"}
      </span>
    </div>
  );
}

function TokenDisplay({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="border border-t-surface/10 p-4">
      <div className="flex items-center justify-between mb-2">
        <code className="font-mono text-[0.75rem] font-bold text-t-accent">{label}</code>
        <button
          onClick={onCopy}
          className="font-mono text-[0.65rem] text-t-surface/50 hover:text-t-accent transition-colors cursor-pointer"
        >
          {copied ? "copied!" : "copy"}
        </button>
      </div>
      <div className="bg-t-dark border border-t-surface/10 p-3">
        <p className="font-mono text-[0.75rem] text-t-surface/80 break-all select-all">
          {value}
        </p>
      </div>
    </div>
  );
}
