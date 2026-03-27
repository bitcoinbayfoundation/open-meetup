import { auth } from "@/lib/auth";
import { createResource } from "@/lib/resources";
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
  if (!data.url || typeof data.url !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }
  if (!data.category) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }

  const resource = await createResource({
    title: data.title,
    url: data.url,
    description: data.description ?? "",
    author_id: session.user.id,
    author: data.author ?? null,
    image: data.image ?? null,
    category: data.category,
    featured: data.featured ?? false,
    status: data.status ?? "draft",
    tags: data.tags ?? [],
  });

  return NextResponse.json(resource, { status: 201 });
}
