"use client";

import { useState, type FormEvent } from "react";

function NewsletterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setName("");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <div className="mt-20 border-t border-t-surface/10 pt-12">
      <p className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
        <span className="text-t-accent">$</span> ./subscribe-to-newsletter.sh
      </p>
      <h2 className="font-mono font-bold lowercase leading-[0.9] tracking-[-0.02em] text-t-surface text-[clamp(1.8rem,4vw,3rem)] mb-6">
        stay in the <span className="text-t-accent">loop.</span>
      </h2>
      <p className="font-sans text-[clamp(0.92rem,1.1vw,1.05rem)] leading-[1.7] text-t-surface/60 max-w-[44ch] mb-8">
        Get updates on upcoming events, workshops, and community news.
      </p>

      {/* Success message */}
      {status === "success" && (
        <div className="border border-green-500/40 bg-green-500/10 p-4 mb-6">
          <p className="font-mono text-green-400 text-sm">
            Subscribed successfully. Check your email for updates.
          </p>
        </div>
      )}

      {/* Error message */}
      {status === "error" && (
        <div className="border border-t-accent-alt/40 bg-t-accent-alt/10 p-4 mb-6">
          <p className="font-mono text-t-accent-alt text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-[44ch]">
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="your name"
          className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors flex-1"
        />
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors flex-1"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-block font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
        >
          {status === "loading" ? "subscribing..." : "subscribe"}
        </button>
      </form>
    </div>
  );
}

export default NewsletterForm;