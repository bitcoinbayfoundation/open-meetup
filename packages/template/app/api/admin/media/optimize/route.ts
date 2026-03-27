import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import sharp from "sharp";

const MAX_WIDTH = 2400;
const MAX_HEIGHT = 2400;
const QUALITY = 80;

const OPTIMIZABLE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/avif",
]);

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, all } = body as { id?: string; all?: boolean };

  let query: string;
  let params: string[];

  if (all) {
    // Find all images that aren't webp
    query = `SELECT id, url, filename, mime_type, folder FROM media WHERE mime_type IN ('image/jpeg', 'image/png', 'image/tiff', 'image/avif')`;
    params = [];
  } else if (id) {
    query = `SELECT id, url, filename, mime_type, folder FROM media WHERE id = $1`;
    params = [id];
  } else {
    return NextResponse.json({ error: "Provide id or all: true" }, { status: 400 });
  }

  const { rows } = await pool.query(query, params);

  if (rows.length === 0) {
    return NextResponse.json({
      optimized: 0,
      skipped: 0,
      message: all ? "No unoptimized images found" : "Image not found or already optimized",
    });
  }

  let optimized = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    if (!OPTIMIZABLE_TYPES.has(row.mime_type)) {
      skipped++;
      continue;
    }

    try {
      // Download the image
      const res = await fetch(row.url);
      if (!res.ok) {
        errors.push(`Failed to fetch ${row.filename}`);
        continue;
      }

      const inputBuffer = Buffer.from(await res.arrayBuffer());
      const image = sharp(inputBuffer);
      const metadata = await image.metadata();

      // Process
      let pipeline = image.rotate();
      const width = metadata.width ?? 0;
      const height = metadata.height ?? 0;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      const outputBuffer = await pipeline.webp({ quality: QUALITY }).toBuffer();

      // Upload optimized version
      const baseName = row.filename.replace(/\.[^.]+$/, "");
      const newFilename = `${baseName}.webp`;
      const blobPath = `media${row.folder === "/" ? "" : `/${row.folder}`}/${Date.now()}-${newFilename}`;

      const blob = await put(blobPath, outputBuffer, {
        access: "public",
        contentType: "image/webp",
      });

      // Delete old blob
      try {
        await del(row.url);
      } catch {
        // Old blob may not be deletable (different store), continue
      }

      // Update DB record
      await pool.query(
        `UPDATE media SET url = $1, filename = $2, mime_type = 'image/webp', size = $3 WHERE id = $4`,
        [blob.url, newFilename, outputBuffer.byteLength, row.id],
      );

      optimized++;
    } catch (err) {
      errors.push(`Error optimizing ${row.filename}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return NextResponse.json({ optimized, skipped, errors: errors.length ? errors : undefined });
}
