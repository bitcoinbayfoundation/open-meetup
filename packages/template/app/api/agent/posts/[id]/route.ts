import { requireApiKey } from "@/lib/require-api-key";
import { getPostById, updatePost } from "@/lib/posts";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const post = await getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const data = await request.json();

  const post = await updatePost(id, {
    title: data.title,
    body: data.body,
    excerpt: data.excerpt,
    featured_image: data.featured_image,
    featured: data.featured,
    status: data.status,
    published_at: data.published_at,
    meta_title: data.meta_title,
    meta_description: data.meta_description,
    og_image: data.og_image,
    tags: data.tags,
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}
