"use client";

import { useState, useCallback, type FormEvent, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Event } from "@/lib/events";
import { uploadAndOptimize } from "@/lib/compress-image";

interface Props {
  event?: Event;
}

export default function EventEditor({ event }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [hosts, setHosts] = useState(event?.hosts ?? "");
  const [startAt, setStartAt] = useState(
    event?.start_at
      ? new Date(event.start_at).toISOString().slice(0, 16)
      : "",
  );
  const [endAt, setEndAt] = useState(
    event?.end_at
      ? new Date(event.end_at).toISOString().slice(0, 16)
      : "",
  );
  const [venueName, setVenueName] = useState(event?.venue_name ?? "");
  const [venueAddress, setVenueAddress] = useState(event?.venue_address ?? "");
  const [image, setImage] = useState(event?.image ?? "");
  const [meetupUrl, setMeetupUrl] = useState(event?.meetup_url ?? "");
  const [isFree, setIsFree] = useState(event?.is_free ?? true);
  const [price, setPrice] = useState(event?.price ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    event?.status ?? "draft",
  );
  const [metaTitle, setMetaTitle] = useState(event?.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(
    event?.meta_description ?? "",
  );
  const [ogImage, setOgImage] = useState(event?.og_image ?? "");

  const [postToMeetup, setPostToMeetup] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showSeo, setShowSeo] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(true); }, []);
  const handleDragLeave = useCallback((e: DragEvent) => { e.preventDefault(); setDragging(false); }, []);

  async function uploadImage(file: File): Promise<string | null> {
    setUploading(true);
    try {
      return await uploadAndOptimize(file);
    } catch {
      setError("Image upload failed.");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setImage(url);
  }

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = await uploadImage(file);
    if (url) setImage(url);
  }, []);

  async function handleOgImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setOgImage(url);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!startAt) {
      setError("Start date/time is required.");
      return;
    }

    setSaving(true);

    const payload = {
      title,
      description,
      hosts: hosts || null,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : null,
      venue_name: venueName || null,
      venue_address: venueAddress || null,
      image: image || null,
      meetup_url: meetupUrl || null,
      is_free: isFree,
      price: price || null,
      status,
      post_to_meetup: !event && postToMeetup,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      og_image: ogImage || null,
    };

    try {
      const url = event ? `/api/events/${event.id}` : "/api/events";
      const method = event ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save.");
      }

      router.push("/admin/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">
            vim {event ? `${event.slug}.event` : "new-event.event"}
          </span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,3.5rem)] mb-10">
          {event ? "edit event" : "new event"}
          <span className="text-t-accent glow">.</span>
        </h1>

        {error && (
          <div className="border border-t-accent-alt/40 bg-t-accent-alt/10 p-4 mb-6">
            <p className="font-mono text-t-accent-alt text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="event title"
            className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-lg focus:border-t-accent focus:outline-none transition-colors mb-4"
          />

          {/* Hosts */}
          <input
            type="text"
            value={hosts}
            onChange={(e) => setHosts(e.target.value)}
            placeholder="hosted by (e.g. Chris V. and Bitcoin B.)"
            className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors mb-4"
          />

          {/* Date/Time row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-mono text-[0.65rem] text-t-surface/50 block mb-1.5">
                start date & time
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="font-mono text-[0.65rem] text-t-surface/50 block mb-1.5">
                end date & time (optional)
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Venue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="venue name (e.g. Tampa Bay Innovation Center)"
              className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
            />
            <input
              type="text"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="address (e.g. 1101 4th St S, St. Petersburg, FL)"
              className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Meetup URL */}
          <input
            type="url"
            value={meetupUrl}
            onChange={(e) => setMeetupUrl(e.target.value)}
            placeholder="meetup.com event url (optional)"
            className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-3 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors mb-4"
          />

          {/* Event image drop zone */}
          {image ? (
            <div className="flex items-center gap-4 mb-4 border border-t-surface/10 p-4">
              <img src={image} alt="Event image preview" className="h-20 w-20 object-cover" />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[0.6rem] text-t-surface/40 truncate block max-w-[300px]">
                  {image}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setImage("")}
                className="font-mono text-[0.6rem] text-t-accent-alt/60 hover:text-t-accent-alt transition-colors shrink-0"
              >
                remove
              </button>
            </div>
          ) : (
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center h-32 mb-4 border border-dashed cursor-pointer transition-colors ${
                dragging
                  ? "border-t-accent/50 bg-t-accent/5"
                  : "border-t-surface/20 hover:border-t-accent/30"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {uploading ? (
                <p className="font-mono text-sm text-t-accent">uploading...</p>
              ) : dragging ? (
                <p className="font-mono text-sm text-t-accent">drop image here</p>
              ) : (
                <>
                  <p className="font-mono text-sm text-t-surface/70 mb-1">
                    drag event image here or click to upload
                  </p>
                  <p className="font-mono text-[0.6rem] text-t-surface/40">
                    supports jpg, png, webp
                  </p>
                </>
              )}
            </label>
          )}

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-6 mb-6">
            {/* Status switch */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <span className="font-mono text-[0.68rem] text-t-surface/50 lowercase">
                {status}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={status === "published"}
                onClick={() =>
                  setStatus((s) => (s === "draft" ? "published" : "draft"))
                }
                className={`relative inline-flex h-5 w-9 items-center transition-colors ${
                  status === "published" ? "bg-t-accent" : "bg-t-surface/15"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform bg-t-surface transition-transform ${
                    status === "published" ? "translate-x-[18px]" : "translate-x-[3px]"
                  }`}
                />
              </button>
            </label>

            {/* Free/Paid switch */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <span className="font-mono text-[0.68rem] text-t-surface/50 lowercase">
                {isFree ? "free" : "paid"}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isFree}
                onClick={() => setIsFree((f) => !f)}
                className={`relative inline-flex h-5 w-9 items-center transition-colors ${
                  isFree ? "bg-t-accent" : "bg-t-surface/15"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform bg-t-surface transition-transform ${
                    isFree ? "translate-x-[18px]" : "translate-x-[3px]"
                  }`}
                />
              </button>
            </label>

            {/* Price input (shown when paid) */}
            {!isFree && (
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="price (e.g. $10)"
                className="bg-t-surface/5 border border-t-surface/15 px-3 py-1 text-t-surface placeholder:text-t-surface/40 font-mono text-[0.75rem] focus:border-t-accent focus:outline-none transition-colors w-32"
              />
            )}

            {/* Post to Meetup switch (new events only) */}
            {!event && (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <span className="font-mono text-[0.68rem] text-t-surface/50 lowercase">
                  post to meetup
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={postToMeetup}
                  onClick={() => setPostToMeetup((m) => !m)}
                  className={`relative inline-flex h-5 w-9 items-center transition-colors ${
                    postToMeetup ? "bg-t-accent" : "bg-t-surface/15"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform bg-t-surface transition-transform ${
                      postToMeetup ? "translate-x-[18px]" : "translate-x-[3px]"
                    }`}
                  />
                </button>
              </label>
            )}

            {/* SEO toggle */}
            <button
              type="button"
              onClick={() => setShowSeo((s) => !s)}
              className="font-mono text-[0.68rem] lowercase text-t-surface/50 hover:text-t-accent transition-colors"
            >
              {showSeo ? "hide seo" : "seo settings"}
            </button>
          </div>

          {/* SEO fields */}
          {showSeo && (
            <div className="border border-t-surface/10 p-4 mb-6 space-y-3">
              <p className="font-mono text-[0.6rem] text-t-surface/40 mb-2">
                <span className="text-t-accent">$</span> seo
              </p>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="meta title (defaults to event title)"
                className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-2 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors"
              />
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="meta description (defaults to event description)"
                rows={2}
                className="w-full bg-t-surface/5 border border-t-surface/15 px-4 py-2 text-t-surface placeholder:text-t-surface/40 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors resize-none"
              />
              <div className="flex items-center gap-3">
                <label className="font-mono text-[0.68rem] text-t-surface/50 cursor-pointer hover:text-t-accent transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOgImageUpload}
                    className="hidden"
                  />
                  upload og image
                </label>
                {ogImage && (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.6rem] text-t-surface/40 truncate max-w-[200px]">
                      {ogImage}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOgImage("")}
                      className="font-mono text-[0.6rem] text-t-accent-alt/60 hover:text-t-accent-alt transition-colors"
                    >
                      remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description editor */}
          <div className="grid grid-cols-1 lg:grid-cols-2 border border-t-surface/10 mb-6">
            {/* Left: raw markdown */}
            <div className="border-b lg:border-b-0 lg:border-r border-t-surface/10">
              <div className="px-4 py-2 border-b border-t-surface/10 font-mono text-[0.6rem] text-t-surface/40">
                <span className="text-t-accent">$</span> description
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="event description (markdown supported)..."
                className="w-full h-[40vh] bg-transparent text-t-surface placeholder:text-t-surface/30 font-mono text-sm p-4 resize-none focus:outline-none"
              />
            </div>

            {/* Right: preview */}
            <div>
              <div className="px-4 py-2 border-b border-t-surface/10 font-mono text-[0.6rem] text-t-surface/40">
                <span className="text-t-accent">$</span> preview
              </div>
              <div className="p-4 overflow-auto h-[40vh] prose-dark">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {description || "*start writing to see preview...*"}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={saving}
            className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
          >
            {saving ? "saving..." : event ? "update event" : "create event"}
          </button>
        </form>
      </div>
    </main>
  );
}
