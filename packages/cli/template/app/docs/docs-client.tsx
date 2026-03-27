"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocTab {
  slug: string;
  title: string;
  content: string;
}

export default function DocsClient({ tabs }: { tabs: DocTab[] }) {
  const [activeSlug, setActiveSlug] = useState(tabs[0]?.slug ?? "");

  // Sync with URL ?tab= param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && tabs.some((t) => t.slug === tab)) {
      setActiveSlug(tab);
    }
  }, [tabs]);

  function setTab(slug: string) {
    setActiveSlug(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", slug);
    window.history.replaceState({}, "", url.toString());
  }

  const activeTab = tabs.find((t) => t.slug === activeSlug) ?? tabs[0];

  // Group tabs for display
  const mainTabs = tabs.filter((t) =>
    ["getting-started", "content-guide", "customization", "config-reference"].includes(t.slug)
  );
  const integrationTabs = tabs.filter((t) =>
    ["vercel", "resend", "zaprite", "meetup", "telegram", "google-maps"].includes(t.slug)
  );

  return (
    <main className="min-h-screen bg-t-dark">
      <div className="mx-auto max-w-[1200px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24">
        {/* Header */}
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span> man open-meetup
        </div>
        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(3rem,8vw,7rem)] mb-12">
          docs<span className="text-t-accent glow">.</span>
        </h1>

        {/* Tab groups */}
        <div className="mb-8 space-y-4">
          {/* Main tabs */}
          <div className="flex flex-wrap gap-2">
            {mainTabs.map((tab) => (
              <button
                key={tab.slug}
                onClick={() => setTab(tab.slug)}
                className={`font-mono text-[0.72rem] lowercase px-4 py-2 border transition-colors cursor-pointer ${
                  activeSlug === tab.slug
                    ? "border-t-accent text-t-accent bg-t-accent/10"
                    : "border-t-surface/20 text-t-surface/55 hover:border-t-accent/40 hover:text-t-accent"
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>

          {/* Integration tabs */}
          <div className="flex flex-wrap gap-2">
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-t-surface/30 self-center mr-2">
              integrations
            </span>
            {integrationTabs.map((tab) => (
              <button
                key={tab.slug}
                onClick={() => setTab(tab.slug)}
                className={`font-mono text-[0.72rem] lowercase px-4 py-2 border transition-colors cursor-pointer ${
                  activeSlug === tab.slug
                    ? "border-t-accent text-t-accent bg-t-accent/10"
                    : "border-t-surface/20 text-t-surface/55 hover:border-t-accent/40 hover:text-t-accent"
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="border border-t-surface/10 bg-t-dark-alt p-8 lg:p-12">
          {activeTab.content ? (
            <div className="prose-dark max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeTab.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="font-mono text-t-surface/40">
              No documentation found for this section.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
