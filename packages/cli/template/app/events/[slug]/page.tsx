import { getEventBySlug, getUpcomingEvents, getRsvps } from "@/lib/events";
import { notFound } from "next/navigation";

export const revalidate = 60;
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import EventRsvp from "./rsvp";
import config from "@/site.config";

export async function generateMetadata(ctx: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await ctx.params;
  const event = await getEventBySlug(slug);
  if (!event) return {};

  const title =
    event.meta_title ||
    `${event.title} — ${config.org.name}`;
  const description =
    event.meta_description ||
    event.description?.slice(0, 160) ||
    `Join us for ${event.title} in ${config.location.city}.`;
  const image = event.og_image || event.image || "/og.webp";

  return {
    title,
    description,
    alternates: {
      canonical: `${config.url}/events/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: event.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default async function EventPage(ctx: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await ctx.params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const isPast = new Date(event.start_at) < new Date();
  const rsvps = await getRsvps(event.id);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: config.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Events",
        item: `${config.url}/events`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: event.title,
        item: `${config.url}/events/${event.slug}`,
      },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    url: `${config.url}/events/${event.slug}`,
    description: event.description?.slice(0, 300) || undefined,
    startDate: event.start_at,
    endDate: event.end_at || undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: event.venue_name
      ? {
          "@type": "Place",
          name: event.venue_name,
          address: event.venue_address
            ? { "@type": "PostalAddress", streetAddress: event.venue_address }
            : undefined,
        }
      : undefined,
    organizer: {
      "@type": "Organization",
      name: config.org.name,
      url: config.url,
    },
    performer: event.hosts
      ? { "@type": "Person", name: event.hosts }
      : undefined,
    image: event.image || undefined,
    isAccessibleForFree: event.is_free,
    offers: event.is_free
      ? undefined
      : {
          "@type": "Offer",
          price: event.price || "0",
          priceCurrency: "USD",
          url:
            event.meetup_url ||
            `${config.url}/events/${event.slug}`,
        },
  };

  return (
    <main className="min-h-screen bg-t-dark scanlines">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        {/* Breadcrumb */}
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <Link
            href="/events"
            className="text-t-surface/60 hover:text-t-accent transition-colors"
          >
            ← all events
          </Link>
          <span className="text-t-surface/40"> / </span>
          <span className="text-t-surface/70">{event.slug}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left column: main content */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            {/* Past badge */}
            {isPast && (
              <span className="inline-block font-mono text-[0.6rem] lowercase px-2 py-0.5 border border-t-surface/20 text-t-surface/40 mb-4">
                past event
              </span>
            )}

            <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2rem,5vw,4rem)] mb-6">
              {event.title}
              <span className="text-t-accent glow">.</span>
            </h1>

            {event.hosts && (
              <p className="font-mono text-sm text-t-surface/60 mb-8">
                hosted by{" "}
                <span className="text-t-surface/90">{event.hosts}</span>
              </p>
            )}

            {/* Event image */}
            {event.image && (
              <div className="border border-t-surface/10 mb-8 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div>
                <h2 className="font-mono font-bold lowercase text-t-surface text-lg mb-4">
                  details
                </h2>
                <div className="prose-dark">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {event.description}
                  </ReactMarkdown>
                </div>
              </div>
            )}

          </div>

          {/* Right column: sidebar — shows first on mobile */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="border border-t-surface/10 p-6 space-y-6 lg:sticky lg:top-28">
              {/* Date & time */}
              <div>
                <p className="font-mono text-[0.6rem] text-t-surface/50 mb-2 uppercase tracking-widest">
                  when
                </p>
                <p className="font-mono text-sm text-t-surface">
                  {formatDate(event.start_at)}
                </p>
                <p className="font-mono text-sm text-t-surface/70">
                  {formatTime(event.start_at)}
                  {event.end_at && ` – ${formatTime(event.end_at)}`}
                </p>
              </div>

              {/* Venue */}
              {event.venue_name && (
                <div>
                  <p className="font-mono text-[0.6rem] text-t-surface/50 mb-2 uppercase tracking-widest">
                    where
                  </p>
                  <a
                    href={`https://maps.apple.com/?q=${encodeURIComponent(
                      event.venue_address
                        ? `${event.venue_name}, ${event.venue_address}`
                        : event.venue_name,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group/map"
                  >
                    <p className="font-mono text-sm text-t-surface group-hover/map:text-t-accent transition-colors">
                      {event.venue_name}
                    </p>
                    {event.venue_address && (
                      <p className="font-mono text-[0.75rem] text-t-surface/60 group-hover/map:text-t-accent/70 transition-colors">
                        {event.venue_address}
                      </p>
                    )}
                    <p className="font-mono text-[0.6rem] text-t-accent/80 mt-1 group-hover/map:text-t-accent transition-colors">
                      open in maps →
                    </p>
                  </a>
                </div>
              )}

              {/* Price */}
              <div>
                <p className="font-mono text-[0.6rem] text-t-surface/50 mb-2 uppercase tracking-widest">
                  price
                </p>
                <span
                  className={`font-mono text-sm ${
                    event.is_free ? "text-green-400" : "text-t-warm"
                  }`}
                >
                  {event.is_free ? "free" : event.price ?? "paid"}
                </span>
              </div>

              {/* RSVP / Meetup link */}
              {event.meetup_url && !isPast && (
                <a
                  href={event.meetup_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-6 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
                >
                  rsvp on meetup
                </a>
              )}

              {/* RSVP */}
              {!isPast && (
                <EventRsvp eventId={event.id} initialRsvps={rsvps} />
              )}

              {/* Attendee count for past events */}
              {isPast && rsvps.length > 0 && (
                <p className="font-mono text-[0.65rem] text-t-surface/40">
                  {rsvps.length} attended
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
