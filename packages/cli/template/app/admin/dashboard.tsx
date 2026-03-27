"use client";

import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function AdminDashboard({ user }: { user: User }) {
  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        {/* Terminal prompt */}
        <div className="font-mono text-[0.65rem] text-t-surface/65 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">
            whoami → {user.email}
          </span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(3rem,8vw,7rem)] mb-16">
          dashboard<span className="text-t-accent glow">.</span>
        </h1>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { label: "posts", desc: "create and manage posts", href: "/admin/posts" },
            { label: "media", desc: "upload and manage assets", href: "/admin/media" },
            { label: "users", desc: "manage users and roles", href: "/admin/users" },
            { label: "events", desc: "manage upcoming events", href: "/admin/events" },
            { label: "resources", desc: "curate learning resources", href: "/admin/resources" },
            { label: "newsletter", desc: "view subscribers", href: "/admin/newsletter" },
            { label: "agent keys", desc: "manage agent api keys", href: "/admin/agent-keys" },
            { label: "meetup", desc: "meetup.com api integration", href: "/admin/meetup" },
            { label: "zaprite", desc: "view payments and orders", href: "/admin/zaprite" },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="border border-t-surface/20 p-6 hover:border-t-accent/30 transition-colors block"
            >
              <p className="font-mono text-[0.6rem] text-t-surface/55 mb-3">
                <span className="text-t-accent">$</span> ./{card.label}
              </p>
              <h2 className="font-mono font-bold lowercase text-t-surface text-lg mb-2">
                {card.label}
              </h2>
              <p className="font-sans text-sm text-t-surface/65">
                {card.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
