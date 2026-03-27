"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/events";
import { useState } from "react";
export default function AdminEventList({ events }: { events: Event[] }) {
  const router = useRouter();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleToggleStatus(event: Event) {
    setTogglingId(event.id);
    const newStatus = event.status === "published" ? "draft" : "published";
    await fetch(`/api/events/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setTogglingId(null);
    router.refresh();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function isPast(event: Event): boolean {
    return new Date(event.start_at) < new Date();
  }

  function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(date: string): string {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        <div className="font-mono text-[0.65rem] text-t-surface/65 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">ls ./events</span>
        </div>

        <div className="flex items-start justify-between mb-8">
          <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)]">
            events<span className="text-t-accent glow">.</span>
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/events/new"
              className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-8 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
            >
              new event
            </Link>
          </div>
        </div>

        {events.length === 0 ? (
          <p className="font-mono text-sm text-t-surface/55">
            no events yet. create your first one.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="border border-t-surface/20 p-5 hover:border-t-surface/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h2 className="font-mono font-bold text-t-surface lowercase truncate">
                        {event.title}
                      </h2>

                      {/* Status badge */}
                      <button
                        onClick={() => handleToggleStatus(event)}
                        disabled={togglingId === event.id}
                        className={`font-mono text-[0.6rem] lowercase px-2 py-0.5 border shrink-0 transition-colors ${
                          event.status === "published"
                            ? "border-t-accent/40 text-t-accent hover:border-t-surface/40 hover:text-t-surface/60"
                            : "border-t-surface/30 text-t-surface/55 hover:border-t-accent/40 hover:text-t-accent"
                        }`}
                      >
                        {togglingId === event.id ? "..." : event.status}
                      </button>

                      {/* Past badge */}
                      {isPast(event) && (
                        <span className="font-mono text-[0.6rem] lowercase px-2 py-0.5 border border-t-surface/25 text-t-surface/45">
                          past
                        </span>
                      )}
                    </div>

                    {/* Meta line */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-[0.65rem] text-t-surface/55">
                        {formatDate(event.start_at)} &middot;{" "}
                        {formatTime(event.start_at)}
                        {event.end_at && ` – ${formatTime(event.end_at)}`}
                        {event.venue_name && ` &middot; ${event.venue_name}`}
                      </p>
                    </div>

                    {event.hosts && (
                      <p className="font-mono text-[0.6rem] text-t-surface/45 mt-1">
                        hosted by {event.hosts}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/admin/events/${event.id}/edit`}
                      className="font-mono text-[0.68rem] lowercase border border-t-surface/25 text-t-surface/65 px-3 py-1 hover:border-t-accent/40 hover:text-t-accent transition-colors cursor-pointer"
                    >
                      edit
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id, event.title)}
                      className="font-mono text-[0.68rem] lowercase border border-t-accent-alt/30 text-t-accent-alt/70 px-3 py-1 hover:border-t-accent-alt hover:text-t-accent-alt hover:bg-t-accent-alt/10 transition-colors cursor-pointer"
                    >
                      delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
