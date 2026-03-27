import { auth } from "@/lib/auth";
import { updateResource, deleteResource } from "@/lib/resources";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/resources/[id]">,
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const data = await request.json();

  const resource = await updateResource(id, data);
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return NextResponse.json(resource);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/resources/[id]">,
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await deleteResource(id);

  return NextResponse.json({ ok: true });
}
