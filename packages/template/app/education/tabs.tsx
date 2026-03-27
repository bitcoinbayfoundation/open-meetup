"use client";

import { useState } from "react";

type ResourceCategory =
  | "documentaries"
  | "books"
  | "articles"
  | "websites"
  | "podcasts";

interface ResourceTag {
  id: string;
  name: string;
  slug: string;
}

interface Resource {
  id: string;
  title: string;
  slug: string;
  url: string;
  description: string;
  author: string | null;
  image: string | null;
  featured: boolean;
  tags: ResourceTag[];
}

interface Props {
  tabs: ResourceCategory[];
  tabLabels: Record<ResourceCategory, string>;
  resources: Record<string, Resource[]>;
}

export default function EducationTabs({ tabs, tabLabels, resources }: Props) {
  const [activeTab, setActiveTab] = useState<ResourceCategory>(tabs[0]);

  const currentResources = resources[activeTab] ?? [];

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-2 mb-12 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-mono text-[0.75rem] lowercase px-4 py-2 border transition-colors ${
              activeTab === tab
                ? "border-t-accent text-t-accent bg-t-accent/5"
                : "border-t-surface/15 text-t-surface/50 hover:border-t-surface/30 hover:text-t-surface"
            }`}
          >
            {tabLabels[tab]}
            <span className="ml-2 text-[0.6rem] opacity-80">
              {(resources[tab] ?? []).length}
            </span>
          </button>
        ))}
      </div>

      {/* Resource sections — same style as the original getonbtc component */}
      {currentResources.map((resource, i) => (
        <div
          key={resource.id}
          className={`${i > 0 ? "mt-20" : ""} border-t border-t-surface/10 pt-12`}
        >
          <p className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
            <span className="text-t-accent">$</span> ./{resource.slug} --open
          </p>

          {resource.image && (
            <div className="mb-8 max-w-md border border-t-surface/10 overflow-hidden">
              <img
                src={resource.image}
                alt={resource.title}
                className="w-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h2 className="font-mono font-bold lowercase leading-[0.9] tracking-[-0.02em] text-t-surface text-[clamp(1.8rem,4vw,3rem)]">
              {resource.title}
              <span className="text-t-accent">.</span>
            </h2>
            {resource.featured && (
              <span className="font-mono text-[0.6rem] text-t-warm">★</span>
            )}
          </div>

          {(resource.author || resource.tags.length > 0) && (
            <div className="flex items-center gap-3 flex-wrap mb-6">
              {resource.author && (
                <span className="font-mono text-[0.75rem] text-t-surface/40">
                  by {resource.author}
                </span>
              )}
              {resource.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="font-mono text-[0.55rem] text-t-accent/70 border border-t-accent/25 px-1.5 py-0.5"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {resource.description && (
            <p className="font-sans text-[clamp(0.92rem,1.1vw,1.05rem)] leading-[1.7] text-t-surface/60 max-w-[44ch] mb-8">
              {resource.description}
            </p>
          )}

          <div>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
            >
              check it out
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
