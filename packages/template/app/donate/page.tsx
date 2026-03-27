"use client";

import { useState } from "react";
import Link from "next/link";
import config from "@/site.config";
import { faqs as allFaqs } from "@/lib/content";
import { donationTiers } from "@/lib/content";

const tiers = donationTiers;

const quickAmounts = [10, 25, 50, 100];

const faqs = allFaqs.donate;

export default function DonatePage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeAmount = selectedAmount ?? (customAmount ? Number(customAmount) : null);

  async function handleDonate() {
    if (!activeAmount || activeAmount < 1) {
      setError("Please select or enter an amount.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: activeAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create donation");
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-t-dark text-t-surface">
      {/* Hero */}
      <section className="px-6 lg:px-12 pt-32 lg:pt-44 pb-16 max-w-[1400px] mx-auto">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6 flex items-center gap-2">
          <span className="text-t-accent">$</span>
          <span className="text-t-surface/70">./support-bitcoin-bay.sh</span>
        </div>
        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(3rem,8vw,7rem)] mb-6">
          donate<span className="text-t-accent glow">.</span>
        </h1>
        <p className="text-t-surface/60 text-lg max-w-2xl leading-relaxed">
          Your contribution helps us continue our mission of Bitcoin education
          and advocacy.
        </p>
      </section>

      {/* Membership Tiers */}
      {tiers.length > 0 && (
      <section className="px-6 lg:px-12 pb-16 max-w-[1400px] mx-auto">
        <h2 className="font-mono text-xl md:text-2xl font-semibold text-t-accent mb-8">
          membership_tiers
        </h2>
        <div className="grid gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="block border-l-4 border-t-accent bg-t-dark-alt p-6 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <h3 className="font-mono text-lg font-semibold text-t-surface">
                  {tier.name}
                </h3>
                <span className="font-mono text-t-accent text-sm">
                  {tier.range}
                </span>
              </div>
              <p className="text-t-surface/80 text-sm">{tier.description}</p>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Quick Donate */}
      <section className="px-6 lg:px-12 pb-16 max-w-[1400px] mx-auto">
        <h2 className="font-mono text-xl md:text-2xl font-semibold text-t-accent mb-8">
          quick_donate
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickAmounts.map((value) => (
            <button
              key={value}
              onClick={() => { setSelectedAmount(value); setCustomAmount(""); setError(""); }}
              className={`block border p-6 text-center transition-colors cursor-pointer ${
                selectedAmount === value
                  ? "bg-t-accent/10 border-t-accent"
                  : "bg-t-dark-alt border-t-accent/30 hover:border-t-accent"
              }`}
            >
              <span className="font-mono text-2xl font-bold text-t-accent">
                ${value}
              </span>
              <span className="block text-t-surface/80 text-sm mt-2 font-mono">
                one-time
              </span>
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="mt-4 flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-t-accent text-lg">$</span>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="custom amount"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); setError(""); }}
              className="w-full bg-t-dark-alt border border-t-accent/30 focus:border-t-accent pl-9 pr-4 py-3.5 font-mono text-t-surface text-[0.85rem] placeholder:text-t-surface/35 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {error && (
          <p className="font-mono text-[0.75rem] text-t-accent-alt mt-3">{error}</p>
        )}

        <button
          onClick={handleDonate}
          disabled={loading || !activeAmount}
          className="block w-full mt-4 bg-t-accent text-t-surface font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] text-center py-3.5 hover:bg-t-surface hover:text-t-dark transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "creating checkout..." : activeAmount ? `donate $${activeAmount}` : "select an amount"}
        </button>

        <p className="text-t-surface/60 text-sm mt-4 font-mono">
          Pay with Bitcoin, Lightning, card, or bank transfer via Zaprite
        </p>
      </section>

      {/* Other Ways to Give */}
      <section className="px-6 lg:px-12 pb-16 max-w-[1400px] mx-auto">
        <h2 className="font-mono text-xl md:text-2xl font-semibold text-t-accent mb-8">
          other_ways_to_give
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/donate/daf"
            className="block bg-t-dark-alt border border-t-accent/30 hover:border-t-accent p-6 transition-colors group"
          >
            <h3 className="font-mono text-lg font-semibold text-t-surface group-hover:text-t-accent transition-colors mb-2">
              donor-advised funds
            </h3>
            <p className="text-t-surface/80 text-sm">
              Give Bitcoin tax-free through Unchained&apos;s DAF program.
            </p>
            <span className="inline-block mt-4 font-mono text-t-accent text-sm">
              $ cd /donate/daf &rarr;
            </span>
          </Link>
          <Link
            href="/donate/employer-match"
            className="block bg-t-dark-alt border border-t-accent/30 hover:border-t-accent p-6 transition-colors group"
          >
            <h3 className="font-mono text-lg font-semibold text-t-surface group-hover:text-t-accent transition-colors mb-2">
              employer matching
            </h3>
            <p className="text-t-surface/80 text-sm">
              Double your impact through your employer&apos;s matching gift
              program.
            </p>
            <span className="inline-block mt-4 font-mono text-t-accent text-sm">
              $ cd /donate/employer-match &rarr;
            </span>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      {faqs.length > 0 && (
        <section className="px-6 lg:px-12 pb-16 max-w-[1400px] mx-auto">
          <h2 className="font-mono text-xl md:text-2xl font-semibold text-t-accent mb-8">
            frequently_asked_questions
          </h2>
          <div className="grid gap-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="bg-t-dark-alt border border-t-accent/20 group"
              >
                <summary className="cursor-pointer p-5 font-mono text-sm text-t-surface hover:text-t-accent transition-colors list-none flex items-center justify-between">
                  <span>{faq.question}</span>
                  <span className="text-t-accent ml-4 group-open:rotate-45 transition-transform text-lg shrink-0">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 text-t-surface/80 text-sm border-t border-t-accent/10 pt-4">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <section className="px-6 lg:px-12 pb-24 max-w-[1400px] mx-auto">
        <div className="border border-t-accent/20 bg-t-dark-alt/50 p-6">
          <p className="font-mono text-xs text-t-surface/60 leading-relaxed">
            {config.org.name} does not provide tax or legal advice. This
            information is educational only and cannot be relied upon as tax
            advice. Please consult with an attorney, CPA, or other tax advisor
            for personalized guidance.
          </p>
        </div>
      </section>
    </main>
  );
}
