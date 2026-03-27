import { getRsvps, addRsvp } from "@/lib/events";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/events/[id]/rsvp">,
) {
  const { id } = await ctx.params;
  const rsvps = await getRsvps(id);
  return NextResponse.json(rsvps);
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/events/[id]/rsvp">,
) {
  const { id } = await ctx.params;
  const { name } = await request.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const rsvp = await addRsvp(id, name);
  return NextResponse.json(rsvp, { status: 201 });
}
