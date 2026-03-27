import { requireApiKey } from "@/lib/require-api-key";
import { getResourceById, updateResource } from "@/lib/resources";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const resource = await getResourceById(id);
  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return NextResponse.json(resource);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const data = await request.json();

  const resource = await updateResource(id, {
    title: data.title,
    url: data.url,
    description: data.description,
    author: data.author,
    image: data.image,
    category: data.category,
    featured: data.featured,
    status: data.status,
    tags: data.tags,
  });

  if (!resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  return NextResponse.json(resource);
}
