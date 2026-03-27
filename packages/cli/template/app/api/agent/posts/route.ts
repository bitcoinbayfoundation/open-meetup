import { requireApiKey } from "@/lib/require-api-key";
import { createPost, getAllPostsAdmin } from "@/lib/posts";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const featured = url.searchParams.get("featured");
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");
  const limit = url.searchParams.get("limit");

  let posts = await getAllPostsAdmin();

  if (status) posts = posts.filter((p) => p.status === status);
  if (featured !== null) posts = posts.filter((p) => p.featured === (featured === "true"));
  if (since) posts = posts.filter((p) => p.created_at >= since);
  if (until) posts = posts.filter((p) => p.created_at <= until);
  if (limit) posts = posts.slice(0, parseInt(limit, 10));

  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const data = await request.json();

  if (!data.title || typeof data.title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const post = await createPost({
    title: data.title,
    body: data.body ?? "",
    author_id: auth.attributedUserId ?? auth.userId,
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
