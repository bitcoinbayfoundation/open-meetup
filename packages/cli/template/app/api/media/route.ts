import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { getAllMedia, createMedia } from "@/lib/media";
import { optimizeImage } from "@/lib/optimize-image";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder") || undefined;
  const media = await getAllMedia(folder);

  return NextResponse.json(media);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { blobUrl, filename: rawFilename, folder: rawFolder, alt } =
    await request.json();

  if (!blobUrl || typeof blobUrl !== "string") {
    return NextResponse.json({ error: "Missing blobUrl" }, { status: 400 });
  }

  const folder = rawFolder || "/";

  // Fetch the raw file from blob storage
  const res = await fetch(blobUrl);
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch blob" },
      { status: 500 },
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const contentType =
    res.headers.get("content-type") ?? "application/octet-stream";
  const originalName = rawFilename ?? blobUrl.split("/").pop() ?? "file";

  // Optimize with sharp
  const file = new File([arrayBuffer], originalName, { type: contentType });
  const { buffer, filename, mimeType } = await optimizeImage(file);

  // Upload optimized version
  const blobPath = `media${folder === "/" ? "" : `/${folder}`}/${Date.now()}-${filename}`;
  const optimized = await put(blobPath, buffer, {
    access: "public",
    contentType: mimeType,
  });

  // Delete the original unoptimized blob
  await del(blobUrl);

  const media = await createMedia({
    filename,
    url: optimized.url,
    alt: alt ?? null,
    mime_type: mimeType,
    size: buffer.byteLength,
    folder,
    uploaded_by: session.user.id,
  });

  return NextResponse.json(media, { status: 201 });
}
