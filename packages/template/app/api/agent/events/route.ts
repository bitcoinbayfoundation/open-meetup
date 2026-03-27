import { requireApiKey } from "@/lib/require-api-key";
import { createEvent, getAllEventsAdmin } from "@/lib/events";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const featured = url.searchParams.get("featured");
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");
  const upcoming = url.searchParams.get("upcoming");
  const limit = url.searchParams.get("limit");

  let events = await getAllEventsAdmin();

  if (status) events = events.filter((e) => e.status === status);
  if (featured !== null) events = events.filter((e) => e.is_free === (featured === "true"));
  if (since) events = events.filter((e) => e.start_at >= since);
  if (until) events = events.filter((e) => e.start_at <= until);
  if (upcoming === "true") events = events.filter((e) => new Date(e.start_at) >= new Date());
  if (limit) events = events.slice(0, parseInt(limit, 10));

  return NextResponse.json(events);
}

export async function POST(request: Request) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const data = await request.json();

  if (!data.title || typeof data.title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!data.start_at) {
    return NextResponse.json({ error: "start_at is required" }, { status: 400 });
  }

  const event = await createEvent({
    title: data.title,
    description: data.description ?? "",
    author_id: auth.attributedUserId ?? auth.userId,
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

  return NextResponse.json(event, { status: 201 });
}
