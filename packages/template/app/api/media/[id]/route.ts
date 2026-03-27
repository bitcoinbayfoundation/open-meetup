import { auth } from "@/lib/auth";
import { deleteMedia, moveMedia } from "@/lib/media";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/media/[id]">,
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const { folder } = await request.json();

  if (!folder || typeof folder !== "string") {
    return NextResponse.json({ error: "folder is required" }, { status: 400 });
  }

  const media = await moveMedia(id, folder);
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(media);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/media/[id]">,
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const deleted = await deleteMedia(id);

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
