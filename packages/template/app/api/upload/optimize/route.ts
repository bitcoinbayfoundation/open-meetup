import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { optimizeImage } from "@/lib/optimize-image";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { blobUrl, pathname } = await request.json();

  if (!blobUrl || typeof blobUrl !== "string") {
    return NextResponse.json({ error: "Missing blobUrl" }, { status: 400 });
  }

  // Fetch the raw file from blob storage
  const res = await fetch(blobUrl);
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch blob" },
      { status: 500 },
    );
  }

  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const originalName = pathname ?? blobUrl.split("/").pop() ?? "image";

  // Create a File object for optimizeImage
  const file = new File([arrayBuffer], originalName, { type: contentType });
  const { buffer, filename, mimeType } = await optimizeImage(file);

  // Upload optimized version
  const optimized = await put(
    `posts/${Date.now()}-${filename}`,
    buffer,
    { access: "public", contentType: mimeType },
  );

  // Delete the original unoptimized blob
  await del(blobUrl);

  return NextResponse.json({ url: optimized.url });
}
