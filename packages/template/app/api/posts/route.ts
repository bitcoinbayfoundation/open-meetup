import { auth } from "@/lib/auth";
import { createPost } from "@/lib/posts";
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

  const post = await createPost({
    title: data.title,
    body: data.body ?? "",
    author_id: data.author_id ?? session.user.id,
    excerpt: data.excerpt ?? null,
    featured_image: data.featured_image ?? null,
    featured: data.featured ?? false,
    status: data.status ?? "draft",
    published_at: data.published_at ?? null,
    meta_title: data.meta_title ?? null,
    meta_description: data.meta_description ?? null,
    og_image: data.og_image ?? null,
    tags: data.tags ?? [],
  });

  return NextResponse.json(post, { status: 201 });
}
