import { requireApiKey } from "@/lib/require-api-key";
import { createResource, getAllResourcesAdmin } from "@/lib/resources";
import type { ResourceCategory } from "@/lib/resources";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const category = url.searchParams.get("category") as ResourceCategory | null;
  const featured = url.searchParams.get("featured");
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");
  const limit = url.searchParams.get("limit");

  let resources = await getAllResourcesAdmin();

  if (status) resources = resources.filter((r) => r.status === status);
  if (category) resources = resources.filter((r) => r.category === category);
  if (featured !== null) resources = resources.filter((r) => r.featured === (featured === "true"));
  if (since) resources = resources.filter((r) => r.created_at >= since);
  if (until) resources = resources.filter((r) => r.created_at <= until);
  if (limit) resources = resources.slice(0, parseInt(limit, 10));

  return NextResponse.json(resources);
}

export async function POST(request: Request) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const data = await request.json();

  if (!data.title || typeof data.title !== "string") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (!data.url || typeof data.url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }
  if (!data.category) {
    return NextResponse.json({ error: "Category is required (documentaries, books, articles, websites, podcasts)" }, { status: 400 });
  }

  const resource = await createResource({
    title: data.title,
    url: data.url,
    description: data.description ?? "",
    author_id: auth.attributedUserId ?? auth.userId,
    author: data.author ?? null,
    image: data.image ?? null,
    category: data.category,
    featured: data.featured ?? false,
    status: data.status ?? "draft",
    tags: data.tags ?? [],
  });

  return NextResponse.json(resource, { status: 201 });
}
