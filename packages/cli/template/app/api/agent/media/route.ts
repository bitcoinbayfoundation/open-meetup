import { put } from "@vercel/blob";
import { requireApiKey } from "@/lib/require-api-key";
import { createMedia } from "@/lib/media";
import { optimizeImage } from "@/lib/optimize-image";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "/";
  const alt = (formData.get("alt") as string) || null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const { buffer, filename, mimeType } = await optimizeImage(file);

  const blobPath = `media${folder === "/" ? "" : `/${folder}`}/${Date.now()}-${filename}`;
  const blob = await put(blobPath, buffer, { access: "public", contentType: mimeType });

  const media = await createMedia({
    filename,
    url: blob.url,
    alt,
    mime_type: mimeType,
    size: buffer.byteLength,
    folder,
    uploaded_by: auth.userId,
  });

  return NextResponse.json(media, { status: 201 });
}
