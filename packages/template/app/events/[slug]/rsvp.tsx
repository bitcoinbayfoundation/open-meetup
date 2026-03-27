"use client";

import { useState, type FormEvent } from "react";
import type { Rsvp } from "@/lib/events";

interface Props {
  eventId: string;
  initialRsvps: Rsvp[];
}

export default function EventRsvp({ eventId, initialRsvps }: Props) {
  const [rsvps, setRsvps] = useState<Rsvp[]>(initialRsvps);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to RSVP");
      }

      const rsvp = await res.json();
      setRsvps((prev) => [...prev, rsvp]);
      setName("");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-t-surface/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono font-bold lowercase text-t-surface text-sm">
          attending
        </h3>
        <span className="font-mono text-[0.65rem] text-t-accent">
          {rsvps.length} going
        </span>
      </div>

      {/* RSVP form */}
      {!submitted ? (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
            className="flex-1 bg-t-surface/5 border border-t-surface/15 px-3 py-2 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="font-mono text-[0.72rem] font-semibold lowercase tracking-[0.04em] bg-t-accent text-t-surface px-5 py-2 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50 shrink-0"
          >
            {submitting ? "..." : "i'm going"}
          </button>
        </form>
      ) : (
        <div className="border border-green-500/20 bg-green-500/5 p-3 mb-4">
          <p className="font-mono text-[0.72rem] text-green-400">
            you're on the list. see you there.
          </p>
        </div>
      )}

      {error && (
        <p className="font-mono text-[0.65rem] text-t-accent-alt mb-3">{error}</p>
      )}

      {/* Attendee list */}
      {rsvps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rsvps.map((rsvp) => (
            <span
              key={rsvp.id}
              className="font-mono text-[0.6rem] text-t-surface/70 border border-t-surface/15 px-2 py-1"
            >
              {rsvp.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
