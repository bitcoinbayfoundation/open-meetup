"use client";

import { useState, type FormEvent } from "react";
import config from "@/site.config";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <main className="min-h-screen bg-t-dark px-6 lg:px-12 pt-32 lg:pt-44 pb-24 flex flex-col items-center">
      <div className="w-full max-w-[600px]">
        {/* Terminal prompt */}
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6 flex items-center gap-2">
          <span className="text-t-accent">$</span>
          <span className="text-t-surface/70">./contact.sh</span>
        </div>

        {/* Heading */}
        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(3rem,8vw,7rem)] mb-6">
          contact<span className="text-t-accent glow">.</span>
        </h1>

        {/* Description */}
        <p className="text-t-surface/60 text-lg mb-12 leading-relaxed">
          Have a question or want to learn more about {config.org.name}?
          We&apos;d love to hear from you.
        </p>

        {/* Success message */}
        {status === "success" && (
          <div className="border border-green-500/40 bg-green-500/10 p-4 mb-8">
            <p className="font-mono text-green-400 text-sm">
              Message sent successfully. We&apos;ll be in touch soon.
            </p>
          </div>
        )}

        {/* Error message */}
        {status === "error" && (
          <div className="border border-t-accent-alt/40 bg-t-accent-alt/10 p-4 mb-8">
            <p className="font-mono text-t-accent-alt text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="name"
              className="font-mono text-xs uppercase tracking-widest text-t-surface/80"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="font-mono text-xs uppercase tracking-widest text-t-surface/80"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="message"
              className="font-mono text-xs uppercase tracking-widest text-t-surface/80"
            >
              Message
            </label>
            <textarea
              id="message"
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind..."
              className="bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-t-accent text-t-surface font-mono text-sm uppercase tracking-widest py-3 px-6 hover:bg-t-accent/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {status === "loading" ? "sending..." : "send message"}
          </button>

          {/* Newsletter note */}
          <p className="text-t-surface/60 text-xs font-mono">
            By submitting this form, you&apos;ll be added to our newsletter.
          </p>
        </form>
      </div>
    </main>
  );
}
