"use client";

import { useEffect, useState } from "react";

interface MeetupEvent {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  endTime: string | null;
  eventUrl: string;
  going: number;
  rsvpNames: string[];
  venue: { name: string; address: string; city: string; state: string } | null;
  image: { baseUrl: string } | null;
  already_imported: boolean;
}

interface MeetupData {
  upcoming: MeetupEvent[];
  past: MeetupEvent[];
}

interface GroupData {
  name: string;
  urlname: string;
  link: string;
  memberships: { totalCount: number };
  events: { totalCount: number };
}

export default function MeetupDebug() {
  const [data, setData] = useState<MeetupData | null>(null);
  const [group, setGroup] = useState<GroupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    id: string;
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, groupRes] = await Promise.all([
        fetch("/api/admin/meetup/events"),
        fetch("/api/admin/meetup"),
      ]);
      const eventsJson = await eventsRes.json();
      const groupJson = await groupRes.json();
      if (!eventsRes.ok) throw new Error(eventsJson.error || "Failed to fetch events");
      if (!groupRes.ok) throw new Error(groupJson.error || "Failed to fetch group info");
      setData(eventsJson);
      setGroup(groupJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(event: MeetupEvent) {
    setImportingId(event.id);
    setImportResult(null);

    try {
      const res = await fetch("/api/admin/meetup/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import failed");

      if (json.imported === 0) {
        setImportResult({
          id: event.id,
          message: "already imported",
          type: "error",
        });
      } else {
        setImportResult({
          id: event.id,
          message: `added as draft with ${event.rsvpNames.length} rsvps`,
          type: "success",
        });
        setData((prev) => {
          if (!prev) return prev;
          const update = (list: MeetupEvent[]) =>
            list.map((e) =>
              e.id === event.id ? { ...e, already_imported: true } : e,
            );
          return { upcoming: update(prev.upcoming), past: update(prev.past) };
        });
      }
    } catch (err) {
      setImportResult({
        id: event.id,
        message: err instanceof Error ? err.message : "Import failed",
        type: "error",
      });
    } finally {
      setImportingId(null);
    }
  }

  async function handleSync(event: MeetupEvent) {
    setSyncingId(event.id);
    setImportResult(null);

    try {
      const res = await fetch("/api/admin/meetup/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetupUrl: event.eventUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Sync failed");

      setImportResult({
        id: event.id,
        message: `synced — ${json.rsvps} rsvps`,
        type: "success",
      });
    } catch (err) {
      setImportResult({
        id: event.id,
        message: err instanceof Error ? err.message : "Sync failed",
        type: "error",
      });
    } finally {
      setSyncingId(null);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

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
          <span className="text-t-surface/70">
            sync meetup.com/tampa-bay-bitcoin
          </span>
        </div>

        <div className="flex items-start justify-between mb-4">
          <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)]">
            meetup<span className="text-t-accent glow">.</span>
          </h1>
          <button
            onClick={fetchData}
            disabled={loading}
            className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] border border-t-surface/30 text-t-surface/70 px-8 py-3 hover:border-t-accent hover:text-t-accent transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "loading..." : "refresh"}
          </button>
        </div>

        {/* Sync description */}
        <p className="font-mono text-[0.7rem] text-t-surface/50 mb-8 max-w-2xl leading-relaxed">
          bidirectional sync with meetup.com. import events from meetup into our
          events table with rsvps, or create events locally and post them to
          meetup.
        </p>

        {error && (
          <div className="border border-red-500/30 bg-red-500/10 p-4 mb-6">
            <p className="font-mono text-[0.75rem] text-red-400">
              error: {error}
            </p>
          </div>
        )}

        {loading && !data && (
          <div className="border border-t-surface/20 p-12 flex items-center justify-center">
            <p className="font-mono text-[0.75rem] text-t-surface/55 animate-pulse">
              fetching meetup data...
            </p>
          </div>
        )}

        {/* Group Info */}
        {group && (
          <div className="border border-t-surface/20 p-6 mb-8">
            <h2 className="font-mono text-[0.8rem] text-t-accent font-bold mb-4 uppercase tracking-wider">
              group
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label="name" value={group.name} />
              <Field label="urlname" value={group.urlname} />
              <Field
                label="members"
                value={String(group.memberships?.totalCount ?? "?")}
              />
              <Field
                label="total events"
                value={String(group.events?.totalCount ?? "?")}
              />
            </div>
            <div className="mt-3">
              <a
                href={group.link}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[0.65rem] text-t-accent hover:underline"
              >
                {group.link}
              </a>
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Upcoming Events */}
            <section className="mb-12">
              <h2 className="font-mono text-[0.8rem] text-t-accent font-bold mb-4 uppercase tracking-wider">
                upcoming ({data.upcoming.length})
              </h2>
              {data.upcoming.length === 0 ? (
                <p className="font-mono text-[0.75rem] text-t-surface/45">
                  no upcoming events on meetup
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.upcoming.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      importingId={importingId}
                      syncingId={syncingId}
                      importResult={importResult}
                      previewId={previewId}
                      onImport={handleImport}
                      onSync={handleSync}
                      onTogglePreview={(id) =>
                        setPreviewId((prev) => (prev === id ? null : id))
                      }
                      formatDate={formatDate}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Past Events */}
            <section>
              <h2 className="font-mono text-[0.8rem] text-t-surface/50 font-bold mb-4 uppercase tracking-wider">
                past ({data.past.length})
              </h2>
              {data.past.length === 0 ? (
                <p className="font-mono text-[0.75rem] text-t-surface/45">
                  no past events found
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.past.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      importingId={importingId}
                      syncingId={syncingId}
                      importResult={importResult}
                      previewId={previewId}
                      onImport={handleImport}
                      onSync={handleSync}
                      onTogglePreview={(id) =>
                        setPreviewId((prev) => (prev === id ? null : id))
                      }
                      formatDate={formatDate}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="font-mono text-[0.75rem] text-t-surface">{value}</p>
    </div>
  );
}

function EventCard({
  event,
  importingId,
  syncingId,
  importResult,
  previewId,
  onImport,
  onSync,
  onTogglePreview,
  formatDate,
  formatTime,
}: {
  event: MeetupEvent;
  importingId: string | null;
  syncingId: string | null;
  importResult: {
    id: string;
    message: string;
    type: "success" | "error";
  } | null;
  previewId: string | null;
  onImport: (event: MeetupEvent) => void;
  onSync: (event: MeetupEvent) => void;
  onTogglePreview: (id: string) => void;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
}) {
  const isImporting = importingId === event.id;
  const isSyncing = syncingId === event.id;
  const result = importResult?.id === event.id ? importResult : null;
  const showPreview = previewId === event.id;

  return (
    <div className="border border-t-surface/15 hover:border-t-surface/25 transition-colors">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <a
                href={event.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-bold text-t-surface lowercase hover:text-t-accent transition-colors truncate"
              >
                {event.title}
              </a>
              {event.already_imported && (
                <span className="font-mono text-[0.6rem] lowercase px-2 py-0.5 border border-green-500/30 text-green-400/70 shrink-0">
                  imported
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-mono text-[0.65rem] text-t-surface/55">
                {formatDate(event.dateTime)} &middot;{" "}
                {formatTime(event.dateTime)}
                {event.endTime && ` – ${formatTime(event.endTime)}`}
              </p>
            </div>

            {event.venue && (
              <p className="font-mono text-[0.6rem] text-t-surface/45 mt-1">
                {event.venue.name}
                {event.venue.city ? `, ${event.venue.city}` : ""}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* RSVP count */}
            <span className="font-mono text-[0.65rem] text-t-accent/70 whitespace-nowrap">
              {event.going} rsvps
            </span>

            {/* Preview toggle */}
            <button
              onClick={() => onTogglePreview(event.id)}
              className="font-mono text-[0.68rem] lowercase border border-t-surface/25 text-t-surface/65 px-3 py-1 hover:border-t-surface/40 hover:text-t-surface transition-colors cursor-pointer"
            >
              {showPreview ? "hide" : "preview"}
            </button>

            {/* Add to events or sync */}
            {event.already_imported ? (
              <button
                onClick={() => onSync(event)}
                disabled={isSyncing}
                className="font-mono text-[0.68rem] font-semibold lowercase border border-t-surface/25 text-t-surface/65 px-3 py-1.5 hover:border-t-accent hover:text-t-accent transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {isSyncing ? "syncing..." : "sync"}
              </button>
            ) : (
              <button
                onClick={() => onImport(event)}
                disabled={isImporting}
                className="font-mono text-[0.68rem] font-semibold lowercase bg-t-accent text-t-surface px-3 py-1.5 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {isImporting ? "adding..." : "add to events"}
              </button>
            )}
          </div>
        </div>

        {/* Result feedback */}
        {result && (
          <p
            className={`font-mono text-[0.65rem] mt-2 ${
              result.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {result.message}
          </p>
        )}
      </div>

      {/* Preview panel */}
      {showPreview && (
        <div className="border-t border-t-surface/10 p-5 bg-t-dark-alt/30">
          {event.image?.baseUrl && (
            <img
              src={event.image.baseUrl}
              alt={event.title}
              className="w-full max-w-md mb-4 border border-t-surface/10"
            />
          )}

          <div className="font-mono text-[0.7rem] text-t-surface/65 whitespace-pre-wrap max-h-[300px] overflow-y-auto mb-4">
            {stripHtmlBasic(event.description)}
          </div>

          {/* RSVP list */}
          {event.rsvpNames.length > 0 && (
            <div className="border-t border-t-surface/10 pt-4">
              <h3 className="font-mono text-[0.7rem] text-t-accent/80 font-bold mb-2 uppercase tracking-wider">
                rsvps ({event.going})
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.rsvpNames.map((name, i) => (
                  <span
                    key={i}
                    className="font-mono text-[0.6rem] text-t-surface/60 border border-t-surface/15 px-2 py-0.5"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function stripHtmlBasic(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
