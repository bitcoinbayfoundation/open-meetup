import sharp from "sharp";

const MAX_WIDTH = 2400;
const MAX_HEIGHT = 2400;
const QUALITY = 80;

const OPTIMIZABLE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/avif",
]);

/**
 * Optimizes an image file for web serving:
 * - Resizes to max 2400px on either dimension (preserving aspect ratio)
 * - Converts to WebP
 * - Strips EXIF/metadata
 * - Returns original file unchanged for non-image or already-small files
 */
export async function optimizeImage(
  file: File,
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  if (!OPTIMIZABLE_TYPES.has(file.type)) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return { buffer, filename: file.name, mimeType: file.type };
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  // Skip optimization for small images (under 50KB and within dimensions)
  if (
    inputBuffer.byteLength < 50_000 &&
    width <= MAX_WIDTH &&
    height <= MAX_HEIGHT
  ) {
    return { buffer: inputBuffer, filename: file.name, mimeType: file.type };
  }

  let pipeline = image.rotate(); // auto-rotate based on EXIF

  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const optimized = await pipeline
    .webp({ quality: QUALITY })
    .toBuffer();

  const baseName = file.name.replace(/\.[^.]+$/, "");

  return {
    buffer: optimized,
    filename: `${baseName}.webp`,
    mimeType: "image/webp",
  };
}
