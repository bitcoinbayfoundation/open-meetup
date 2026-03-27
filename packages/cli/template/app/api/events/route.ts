import { auth } from "@/lib/auth";
import { createEvent, updateEvent } from "@/lib/events";
import { createMeetupEvent, uploadMeetupEventPhoto } from "@/lib/meetup";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  if (!data.title || typeof data.title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!data.start_at) {
    return NextResponse.json({ error: "Start date is required" }, { status: 400 });
  }

  const event = await createEvent({
    title: data.title,
    description: data.description ?? "",
    author_id: session.user.id,
    hosts: data.hosts ?? null,
    start_at: data.start_at,
    end_at: data.end_at ?? null,
    venue_name: data.venue_name ?? null,
    venue_address: data.venue_address ?? null,
    image: data.image ?? null,
    meetup_url: data.meetup_url ?? null,
    is_free: data.is_free ?? true,
    price: data.price ?? null,
    status: data.status ?? "draft",
    meta_title: data.meta_title ?? null,
    meta_description: data.meta_description ?? null,
    og_image: data.og_image ?? null,
  });

  // Post to Meetup.com in the background
  if (data.post_to_meetup) {
    (async () => {
      try {
        const meetup = await createMeetupEvent({
          title: data.title,
          description: data.description ?? "",
          startAt: data.start_at,
          endAt: data.end_at ?? null,
        });

        // Update local event with meetup URL
        await updateEvent(event.id, { meetup_url: meetup.meetupUrl });

        // Upload image if present
        if (data.image) {
          await uploadMeetupEventPhoto(meetup.meetupEventId, data.image);
        }
      } catch (err) {
        console.error("Failed to create Meetup event:", err);
      }
    })();
  }

  return NextResponse.json(event, { status: 201 });
}
