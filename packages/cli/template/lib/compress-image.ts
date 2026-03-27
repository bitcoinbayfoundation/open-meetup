/**
 * Client-side upload via Vercel Blob (bypasses 4.5MB serverless limit)
 * then server-side optimization via sharp.
 */
import { upload } from "@vercel/blob/client";

/**
 * Upload a file directly to Vercel Blob from the browser,
 * then call the server to optimize it with sharp.
 * Returns the final optimized URL.
 */
export async function uploadAndOptimize(file: File): Promise<string> {
  // Step 1: Upload directly to Vercel Blob (no size limit)
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/upload/handle",
  });

  // Step 2: Optimize server-side (sharp → WebP, resize, strip EXIF)
  const res = await fetch("/api/upload/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blobUrl: blob.url, pathname: file.name }),
  });

  if (!res.ok) {
    // If optimization fails, return the unoptimized URL
    return blob.url;
  }

  const { url } = await res.json();
  return url;
}
