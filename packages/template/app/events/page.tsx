import { genMetadata } from "@/lib/og";
import { getUpcomingEvents, getPastEvents } from "@/lib/events";
import type { Event } from "@/lib/events";
import Link from "next/link";
import config from "@/site.config";

export const revalidate = 60;

export const metadata = genMetadata({
  path: "/events",
  title: `Bitcoin & Blockchain Events in ${config.location.city}, ${config.location.stateAbbrev} — ${config.org.name}`,
  image: "/og/events.png",
  description:
    `Join ${config.org.name}'s meetups and events in ${config.location.city}, ${config.location.state}. Bitcoin 101 sessions, Bitdevs, community meetups, workshops, and special events. Open to all — beginners welcome.`,
});

const meetupUrl = config.meetup ? `https://www.meetup.com/${config.meetup.groupSlug}/` : undefined;

const eventsFaqs = [
  {
    question: `How often does ${config.org.shortName} host events?`,
    answer:
      `${config.org.name} hosts multiple events per month across the ${config.location.areaDescription}. These include community meetups, Bitcoin 101 beginner workshops, Bitdevs developer sessions, business workshops, and special events.`,
  },
  {
    question: `Are ${config.org.shortName} events free to attend?`,
    answer:
      `Yes, the majority of ${config.org.name} events are completely free and open to the public. This includes all community meetups, Bitcoin 101 workshops, Bitdevs sessions, and business workshops. Some special ticketed events are fundraisers for the nonprofit.`,
  },
  {
    question: `Where are ${config.org.shortName} meetups held?`,
    answer:
      `${config.org.name} events are held at various venues across the ${config.location.areaDescription}. Venue details are posted with each event listing. Check ${config.contact.domain}/events${meetupUrl ? ` or our Meetup group` : ""} for specific locations.`,
  },
  {
    question: "Do I need Bitcoin experience to attend?",
    answer:
      `No experience is needed. ${config.org.name} events are designed for all skill levels. Bitcoin 101 sessions start from the very basics — what money is, what Bitcoin is, how to set up a wallet, and how to make your first transaction. Veterans are equally welcome at community meetups and Bitdevs.`,
  },
];

const eventsFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: eventsFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

function formatEventDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventTime(date: string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function EventCard({ event }: { event: Event & { rsvp_count?: number } }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="border border-t-surface/10 hover:border-t-accent/30 transition-colors block group"
    >
      {event.image && (
        <div className="aspect-[2/1] overflow-hidden border-b border-t-surface/10">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        </div>
      )}
      <div className="p-5 md:p-6">
        {/* Date line */}
        <p className="font-mono text-[0.65rem] text-t-accent mb-2">
          {formatEventDate(event.start_at)} &middot;{" "}
          {formatEventTime(event.start_at)}
          {event.end_at && ` – ${formatEventTime(event.end_at)}`}
        </p>

        <h2 className="font-mono font-bold text-t-surface text-lg lowercase mb-2 group-hover:text-t-accent transition-colors">
          {event.title}
        </h2>

        {event.hosts && (
          <p className="font-mono text-[0.65rem] text-t-surface/50 mb-3">
            hosted by {event.hosts}
          </p>
        )}

        {/* Venue */}
        {event.venue_name && (
          <p className="font-sans text-sm text-t-surface/60">
            {event.venue_name}
            {event.venue_address && (
              <span className="text-t-surface/50">
                {" "}
                &middot; {event.venue_address}
              </span>
            )}
          </p>
        )}

        {/* Price badge */}
        <div className="mt-3 flex items-center gap-3">
          <span
            className={`font-mono text-[0.6rem] lowercase px-2 py-0.5 border ${
              event.is_free
                ? "border-green-500/30 text-green-400"
                : "border-t-warm/30 text-t-warm"
            }`}
          >
            {event.is_free ? "free" : event.price ?? "paid"}
          </span>
          {event.rsvp_count != null && event.rsvp_count > 0 && (
            <span className="font-mono text-[0.6rem] text-t-surface/50">
              {event.rsvp_count} going
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function buildEventsJsonLd(events: Event[]) {
  return events.map((event) => ({
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
            ? {
                "@type": "PostalAddress",
                streetAddress: event.venue_address,
              }
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
          url: event.meetup_url || `${config.url}/events/${event.slug}`,
        },
  }));
}

interface EventSection {
  label: string;
  events: (Event & { rsvp_count?: number })[];
}

function groupUpcomingEvents(events: (Event & { rsvp_count?: number })[]): EventSection[] {
  if (events.length === 0) return [];

  const now = new Date();
  // Find Sunday of the current week (week boundary = Sun–Sat)
  const currentDay = now.getDay(); // 0=Sun
  const thisWeekStart = new Date(now);
  thisWeekStart.setHours(0, 0, 0, 0);
  thisWeekStart.setDate(now.getDate() - currentDay);

  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 7); // Next Sunday 00:00

  const nextWeekEnd = new Date(thisWeekEnd);
  nextWeekEnd.setDate(thisWeekEnd.getDate() + 7); // Sunday after next 00:00

  const thisWeekEvents: typeof events = [];
  const nextWeekEvents: typeof events = [];
  const laterEvents: typeof events = [];

  for (const event of events) {
    const eventDate = new Date(event.start_at);
    if (eventDate < thisWeekEnd) {
      thisWeekEvents.push(event);
    } else if (eventDate < nextWeekEnd) {
      nextWeekEvents.push(event);
    } else {
      laterEvents.push(event);
    }
  }

  const sections: EventSection[] = [];

  if (thisWeekEvents.length > 0) {
    sections.push({ label: "this week", events: thisWeekEvents });
  }
  if (nextWeekEvents.length > 0) {
    sections.push({ label: "next week", events: nextWeekEvents });
  }

  // Group remaining events by month
  if (laterEvents.length > 0) {
    const monthGroups = new Map<string, typeof events>();
    for (const event of laterEvents) {
      const d = new Date(event.start_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const group = monthGroups.get(key) ?? [];
      group.push(event);
      monthGroups.set(key, group);
    }

    for (const [key, group] of monthGroups) {
      const [year, month] = key.split("-").map(Number);
      const monthDate = new Date(year, month);
      const label = monthDate.toLocaleDateString("en-US", {
        month: "long",
        year: now.getFullYear() !== year ? "numeric" : undefined,
      }).toLowerCase();
      sections.push({ label, events: group });
    }
  }

  return sections;
}

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
  ]);

  const allPublished = [...upcoming, ...past];
  const jsonLd = buildEventsJsonLd(allPublished);
  const upcomingSections = groupUpcomingEvents(upcoming);

  return (
    <main className="min-h-screen bg-t-dark scanlines">
      {jsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              jsonLd.length === 1 ? jsonLd[0] : jsonLd,
            ),
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventsFaqJsonLd) }}
      />

      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        {/* Terminal prompt */}
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">
            curl api.{config.contact.domain}/events
          </span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(3rem,8vw,7rem)] mb-6">
          events<span className="text-t-accent glow">.</span>
        </h1>

        <p className="text-t-surface/60 text-lg mb-16 max-w-2xl leading-relaxed">
          Bitcoin meetups, workshops, and community events in {config.location.city}.
          Open to all levels — beginners welcome.
        </p>

        {/* Upcoming Events — time-based sections */}
        {upcomingSections.length === 0 ? (
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-mono font-bold lowercase text-t-surface text-xl">
                upcoming
              </h2>
              <div className="flex-1 border-t border-t-surface/10" />
            </div>
            <div className="border border-t-surface/10 p-8">
              <p className="font-mono text-sm text-t-surface/40 mb-4">
                no upcoming events scheduled.
              </p>
              {meetupUrl && (
                <a
                  href={meetupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[0.78rem] lowercase text-t-accent hover:text-t-surface transition-colors"
                >
                  check our meetup group for updates →
                </a>
              )}
            </div>
          </section>
        ) : (
          upcomingSections.map((section) => (
            <section key={section.label} className="mb-16">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="font-mono font-bold lowercase text-t-surface text-xl">
                  {section.label}
                </h2>
                <div className="flex-1 border-t border-t-surface/10" />
                <span className="font-mono text-[0.6rem] text-t-surface/50">
                  {section.events.length} event{section.events.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ))
        )}

        {/* Past Events */}
        {past.length > 0 && (
          <section>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="font-mono font-bold lowercase text-t-surface text-xl">
                past events
              </h2>
              <div className="flex-1 border-t border-t-surface/10" />
              <span className="font-mono text-[0.6rem] text-t-surface/50">
                {past.length} event{past.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mt-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-mono font-bold lowercase text-t-surface text-xl">
              frequently asked
            </h2>
            <div className="flex-1 border-t border-t-surface/10" />
          </div>
          <div className="space-y-4 max-w-[72ch]">
            {eventsFaqs.map((faq) => (
              <details
                key={faq.question}
                className="border border-t-surface/10 bg-t-surface/5 group"
              >
                <summary className="cursor-pointer p-5 font-mono text-[0.85rem] text-t-surface/80 hover:text-t-accent transition-colors list-none flex items-center justify-between">
                  <span>{faq.question}</span>
                  <span className="text-t-accent ml-4 group-open:rotate-45 transition-transform text-lg shrink-0">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 text-t-surface/60 text-[0.85rem] leading-[1.8] border-t border-t-surface/10 pt-4">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Meetup CTA */}
        {meetupUrl && (
          <div className="mt-16 border-t border-t-surface/10 pt-12 text-center">
            <p className="font-mono text-sm text-t-surface/60 mb-6">
              rsvp and stay updated on our meetup group
            </p>
            <a
              href={meetupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-8 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
            >
              view on meetup
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
