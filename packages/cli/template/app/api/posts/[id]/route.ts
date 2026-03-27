import { auth } from "@/lib/auth";
import { updatePost, deletePost } from "@/lib/posts";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  ctx: RouteContext<"/api/posts/[id]">,
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const data = await request.json();

  const post = await updatePost(id, data);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/posts/[id]">,
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await deletePost(id);

  return NextResponse.json({ ok: true });
}
