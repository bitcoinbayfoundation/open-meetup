import { auth } from "@/lib/auth";
import { updateEvent, deleteEvent, getEventById } from "@/lib/events";
import { editMeetupEvent, extractMeetupEventId } from "@/lib/meetup";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/events/[id]">,
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const data = await request.json();

  const event = await updateEvent(id, data);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Push edits to Meetup.com in the background if this event is linked
  if (event.meetup_url) {
    const meetupId = extractMeetupEventId(event.meetup_url);
    if (meetupId) {
      (async () => {
        try {
          await editMeetupEvent(meetupId, {
            title: data.title ?? undefined,
            description: data.description ?? undefined,
            startAt: data.start_at ?? undefined,
            endAt: data.end_at !== undefined ? data.end_at : undefined,
          });
        } catch (err) {
          console.error("Failed to sync edit to Meetup:", err);
        }
      })();
    }
  }

  return NextResponse.json(event);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/events/[id]">,
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await deleteEvent(id);

  return NextResponse.json({ ok: true });
}
