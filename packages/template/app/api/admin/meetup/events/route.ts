import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getMeetupEvents,
  getMeetupEventById,
  extractMeetupEventId,
  type MeetupEvent,
} from "@/lib/meetup";
import {
  createEvent,
  getEventsByMeetupUrls,
  getEventByMeetupUrl,
  updateEvent,
  addRsvp,
  clearRsvps,
} from "@/lib/events";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { upcoming, past } = await getMeetupEvents();
    const allEvents = [...upcoming, ...past];
    const meetupUrls = allEvents.map((e) => e.eventUrl);
    const importedUrls = await getEventsByMeetupUrls(meetupUrls);
    const importedSet = new Set(importedUrls);

    const results = {
      upcoming: upcoming.map((e) => ({
        ...e,
        already_imported: importedSet.has(e.eventUrl),
      })),
      past: past.map((e) => ({
        ...e,
        already_imported: importedSet.has(e.eventUrl),
      })),
    };

    return NextResponse.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function stripHtml(html: string): string {
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

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  // Support both single event and array of events
  const events: MeetupEvent[] = Array.isArray(body.events)
    ? body.events
    : body.event
      ? [body.event]
      : [];

  if (events.length === 0) {
    return NextResponse.json({ error: "No events provided" }, { status: 400 });
  }

  // Dedup check
  const meetupUrls = events.map((e) => e.eventUrl);
  const alreadyImported = await getEventsByMeetupUrls(meetupUrls);
  const importedSet = new Set(alreadyImported);

  const toImport = events.filter((e) => !importedSet.has(e.eventUrl));

  if (toImport.length === 0) {
    return NextResponse.json({ imported: 0, message: "All events already imported" });
  }

  const imported = await Promise.all(
    toImport.map(async (e) => {
      const venueAddress = e.venue
        ? [e.venue.address, e.venue.city, e.venue.state].filter(Boolean).join(", ")
        : null;

      const event = await createEvent({
        title: e.title,
        description: stripHtml(e.description),
        author_id: session.user.id,
        start_at: e.dateTime,
        end_at: e.endTime ?? undefined,
        venue_name: e.venue?.name ?? null,
        venue_address: venueAddress,
        meetup_url: e.eventUrl,
        image: e.image?.baseUrl ?? null,
        is_free: true,
        status: "draft",
      });

      // Import RSVPs from Meetup
      const rsvpNames: string[] = e.rsvpNames ?? [];
      if (rsvpNames.length > 0) {
        await Promise.all(
          rsvpNames.map((name) => addRsvp(event.id, name)),
        );
      }

      return event;
    }),
  );

  return NextResponse.json({ imported: imported.length, events: imported }, { status: 201 });
}

// Sync: pull latest data from Meetup into an already-imported local event
export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { meetupUrl } = await request.json();
  if (!meetupUrl) {
    return NextResponse.json({ error: "meetupUrl required" }, { status: 400 });
  }

  // Find the local event
  const localEvent = await getEventByMeetupUrl(meetupUrl);
  if (!localEvent) {
    return NextResponse.json(
      { error: "Event not found in local database" },
      { status: 404 },
    );
  }

  // Fetch fresh data from Meetup
  const meetupId = extractMeetupEventId(meetupUrl);
  if (!meetupId) {
    return NextResponse.json(
      { error: "Could not extract Meetup event ID from URL" },
      { status: 400 },
    );
  }

  const meetupEvent = await getMeetupEventById(meetupId);

  const venueAddress = meetupEvent.venue
    ? [meetupEvent.venue.address, meetupEvent.venue.city, meetupEvent.venue.state]
        .filter(Boolean)
        .join(", ")
    : null;

  // Update local event with Meetup data
  const updated = await updateEvent(localEvent.id, {
    title: meetupEvent.title,
    description: stripHtml(meetupEvent.description),
    start_at: meetupEvent.dateTime,
    end_at: meetupEvent.endTime,
    venue_name: meetupEvent.venue?.name ?? null,
    venue_address: venueAddress,
    image: meetupEvent.image?.baseUrl ?? localEvent.image,
  });

  // Sync RSVPs: clear and re-import
  await clearRsvps(localEvent.id);
  if (meetupEvent.rsvpNames.length > 0) {
    await Promise.all(
      meetupEvent.rsvpNames.map((name) => addRsvp(localEvent.id, name)),
    );
  }

  return NextResponse.json({
    synced: true,
    event: updated,
    rsvps: meetupEvent.rsvpNames.length,
  });
}
