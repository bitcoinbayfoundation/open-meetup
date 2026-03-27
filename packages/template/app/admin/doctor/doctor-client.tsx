"use client";

import { useEffect, useState } from "react";

interface Check {
  name: string;
  status: "ok" | "warning" | "error";
  description: string;
  detail?: string;
  docLink?: string;
}

interface DoctorResult {
  summary: { total: number; ok: number; warnings: number; errors: number };
  checks: Check[];
}

const statusIcon = {
  ok: "✓",
  warning: "!",
  error: "✗",
} as const;

const statusColor = {
  ok: "text-green-400 border-green-500/30 bg-green-500/10",
  warning: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  error: "text-red-400 border-red-500/30 bg-red-500/10",
} as const;

const statusBadge = {
  ok: "border-green-500/30 text-green-400",
  warning: "border-amber-500/30 text-amber-400",
  error: "border-red-500/30 text-red-400",
} as const;

export default function DoctorClient() {
  const [data, setData] = useState<DoctorResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/doctor")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-t-dark pt-28 px-6 lg:px-12">
        <div className="max-w-[1000px] mx-auto">
          <p className="font-mono text-t-surface/50 animate-pulse">running diagnostics...</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-t-dark pt-28 px-6 lg:px-12">
        <div className="max-w-[1000px] mx-auto">
          <p className="font-mono text-red-400">Error: {error ?? "Unknown error"}</p>
        </div>
      </main>
    );
  }

  // Group checks into categories
  const contentNames = ["About Page Content", "FAQ Content", "Donation Tiers", "Logo", "Favicon"];
  const integrationWarnNames = ["Meetup Partial Config", "Resend Partial Config"];
  const isConfigCheck = (c: Check) => c.description.startsWith("site.config.ts");

  const envChecks = data.checks.filter((c) => !isConfigCheck(c) && !contentNames.includes(c.name) && !integrationWarnNames.includes(c.name));
  const integrationWarnings = data.checks.filter((c) => integrationWarnNames.includes(c.name));
  const contentChecks = data.checks.filter((c) => contentNames.includes(c.name));
  const configChecks = data.checks.filter(isConfigCheck);

  return (
    <main className="min-h-screen bg-t-dark pt-28 pb-24 px-6 lg:px-12">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span> ./doctor.sh --diagnose
        </div>
        <h1 className="font-mono font-bold lowercase text-t-surface text-3xl mb-4">
          doctor<span className="text-t-accent">.</span>
        </h1>
        <p className="font-sans text-t-surface/60 mb-8 max-w-[60ch]">
          Site health check. Verifies environment variables, content files, brand assets, and configuration.
        </p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="border border-green-500/20 bg-green-500/5 p-4">
            <p className="font-mono text-3xl font-bold text-green-400">{data.summary.ok}</p>
            <p className="font-mono text-[0.7rem] text-green-400/70 mt-1">passing</p>
          </div>
          <div className="border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="font-mono text-3xl font-bold text-amber-400">{data.summary.warnings}</p>
            <p className="font-mono text-[0.7rem] text-amber-400/70 mt-1">warnings</p>
          </div>
          <div className="border border-red-500/20 bg-red-500/5 p-4">
            <p className="font-mono text-3xl font-bold text-red-400">{data.summary.errors}</p>
            <p className="font-mono text-[0.7rem] text-red-400/70 mt-1">errors</p>
          </div>
        </div>

        {/* Environment Variables */}
        <Section title="environment variables" subtitle="API keys and service connections">
          {envChecks.map((check) => (
            <CheckRow key={check.name} check={check} />
          ))}
          {integrationWarnings.map((check) => (
            <CheckRow key={check.name} check={check} />
          ))}
        </Section>

        {/* Content */}
        <Section title="content" subtitle="Pages, FAQs, and text content">
          {contentChecks.map((check) => (
            <CheckRow key={check.name} check={check} />
          ))}
        </Section>

        {/* Site Config */}
        <Section title="site config" subtitle="Values in site.config.ts — defaults should be customized">
          {configChecks.map((check) => (
            <CheckRow key={check.name} check={check} />
          ))}
        </Section>
      </div>
    </main>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <div className="border-t border-t-surface/10 pt-8 mb-6">
        <h2 className="font-mono font-bold lowercase text-t-surface text-lg">
          {title}<span className="text-t-accent">.</span>
        </h2>
        <p className="font-sans text-[0.8rem] text-t-surface/40 mt-1">{subtitle}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function CheckRow({ check }: { check: Check }) {
  return (
    <div className={`border p-4 ${statusColor[check.status]}`}>
      <div className="flex items-start gap-3">
        <span className={`font-mono text-sm font-bold mt-0.5 ${statusBadge[check.status]}`}>
          {statusIcon[check.status]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <p className="font-mono text-[0.85rem] text-t-surface font-semibold">
              {check.name}
            </p>
            <span className={`font-mono text-[0.6rem] uppercase tracking-wider px-1.5 py-0.5 border ${statusBadge[check.status]}`}>
              {check.status}
            </span>
          </div>
          <p className="font-sans text-[0.8rem] text-t-surface/60 leading-relaxed">
            {check.description}
          </p>
          {check.detail && (
            <p className="font-mono text-[0.7rem] text-t-surface/40 mt-1">
              {check.detail}
            </p>
          )}
          {check.docLink && check.status !== "ok" && (
            <a
              href={check.docLink}
              className="inline-block font-mono text-[0.68rem] text-t-accent hover:text-t-surface transition-colors mt-2"
            >
              view setup guide →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
