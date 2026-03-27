import { del } from "@vercel/blob";
import { pool, isDbConfigured } from "./db";

export interface Media {
  id: string;
  filename: string;
  url: string;
  alt: string | null;
  mime_type: string;
  size: number;
  folder: string;
  uploaded_by: string;
  created_at: string;
}

export async function getAllMedia(folder?: string): Promise<Media[]> {
  if (folder) {
    const { rows } = await pool.query(
      `SELECT * FROM media WHERE folder = $1 ORDER BY created_at DESC`,
      [folder],
    );
    return rows;
  }
  const { rows } = await pool.query(
    `SELECT * FROM media ORDER BY created_at DESC`,
  );
  return rows;
}

export async function getMediaById(id: string): Promise<Media | null> {
  const { rows } = await pool.query(`SELECT * FROM media WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createMedia(data: {
  filename: string;
  url: string;
  alt?: string | null;
  mime_type: string;
  size: number;
  folder: string;
  uploaded_by: string;
}): Promise<Media> {
  const { rows } = await pool.query(
    `INSERT INTO media (filename, url, alt, mime_type, size, folder, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.filename,
      data.url,
      data.alt ?? null,
      data.mime_type,
      data.size,
      data.folder,
      data.uploaded_by,
    ],
  );
  return rows[0];
}

export async function deleteMedia(id: string): Promise<boolean> {
  const media = await getMediaById(id);
  if (!media) return false;

  await del(media.url);
  await pool.query(`DELETE FROM media WHERE id = $1`, [id]);
  return true;
}

export async function getFolders(): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT DISTINCT folder FROM media ORDER BY folder`,
  );
  return rows.map((r) => r.folder);
}

export interface FolderInfo {
  name: string;
  count: number;
}

export async function getFoldersWithCounts(): Promise<FolderInfo[]> {
  const { rows } = await pool.query(
    `SELECT folder AS name, COUNT(*)::int AS count
     FROM media
     GROUP BY folder
     ORDER BY folder`,
  );
  return rows;
}

export async function getPublicGallery(): Promise<
  { folder: string; images: Media[] }[]
> {
  if (!isDbConfigured) return [];
  const { rows } = await pool.query(
    `SELECT * FROM media
     WHERE mime_type LIKE 'image/%'
     ORDER BY folder, created_at DESC`,
  );
  const grouped = new Map<string, Media[]>();
  for (const row of rows) {
    const list = grouped.get(row.folder) ?? [];
    list.push(row);
    grouped.set(row.folder, list);
  }
  return Array.from(grouped.entries()).map(([folder, images]) => ({
    folder,
    images,
  }));
}

export async function moveMedia(
  id: string,
  newFolder: string,
): Promise<Media | null> {
  const { rows } = await pool.query(
    `UPDATE media SET folder = $1 WHERE id = $2 RETURNING *`,
    [newFolder, id],
  );
  return rows[0] ?? null;
}

export async function createFolder(name: string): Promise<void> {
  // Insert a placeholder that gets cleaned up, or we just track folders implicitly
  // Folders exist when media items reference them — no separate table needed
}

export async function renameFolder(
  oldName: string,
  newName: string,
): Promise<number> {
  const { rowCount } = await pool.query(
    `UPDATE media SET folder = $1 WHERE folder = $2`,
    [newName, oldName],
  );
  return rowCount ?? 0;
}
