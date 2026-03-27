import { requireApiKey } from "@/lib/require-api-key";
import { getEventById, updateEvent } from "@/lib/events";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const data = await request.json();

  const event = await updateEvent(id, {
    title: data.title,
    description: data.description,
    hosts: data.hosts,
    start_at: data.start_at,
    end_at: data.end_at,
    venue_name: data.venue_name,
    venue_address: data.venue_address,
    image: data.image,
    meetup_url: data.meetup_url,
    is_free: data.is_free,
    price: data.price,
    status: data.status,
    meta_title: data.meta_title,
    meta_description: data.meta_description,
    og_image: data.og_image,
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}
