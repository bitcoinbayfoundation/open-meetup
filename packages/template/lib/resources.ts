import { pool, isDbConfigured } from "./db";
import { slugify } from "./posts";

export const RESOURCE_CATEGORIES = [
  "documentaries",
  "books",
  "articles",
  "websites",
  "podcasts",
] as const;

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number];

export interface ResourceTag {
  id: string;
  name: string;
  slug: string;
}

export interface Resource {
  id: string;
  title: string;
  slug: string;
  url: string;
  description: string;
  author: string | null;
  image: string | null;
  category: ResourceCategory;
  featured: boolean;
  status: "draft" | "published";
  author_id: string;
  author_name: string;
  tags: ResourceTag[];
  created_at: string;
  updated_at: string;
}

async function uniqueSlug(
  title: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let i = 2;

  while (true) {
    const { rows } = await pool.query(
      excludeId
        ? `SELECT id FROM resources WHERE slug = $1 AND id != $2`
        : `SELECT id FROM resources WHERE slug = $1`,
      excludeId ? [slug, excludeId] : [slug],
    );
    if (rows.length === 0) return slug;
    slug = `${base}-${i++}`;
  }
}

async function attachTags(resources: Resource[]): Promise<Resource[]> {
  if (resources.length === 0) return resources;
  const ids = resources.map((r) => r.id);
  const { rows } = await pool.query(
    `SELECT rtm.resource_id, rt.id, rt.name, rt.slug
     FROM resource_tag_map rtm
     JOIN resource_tags rt ON rt.id = rtm.tag_id
     WHERE rtm.resource_id = ANY($1)`,
    [ids],
  );
  const tagMap = new Map<string, ResourceTag[]>();
  for (const row of rows) {
    const list = tagMap.get(row.resource_id) ?? [];
    list.push({ id: row.id, name: row.name, slug: row.slug });
    tagMap.set(row.resource_id, list);
  }
  return resources.map((r) => ({ ...r, tags: tagMap.get(r.id) ?? [] }));
}

export async function getPublishedResources(
  category?: ResourceCategory,
): Promise<Resource[]> {
  if (!isDbConfigured) return [];

  let query = `
    SELECT r.*, u.name AS author_name
    FROM resources r
    JOIN "user" u ON u.id = r.author_id
    WHERE r.status = 'published'
  `;
  const params: string[] = [];

  if (category) {
    params.push(category);
    query += ` AND r.category = $1`;
  }

  query += ` ORDER BY r.featured DESC, r.created_at DESC`;

  const { rows } = await pool.query(query, params);
  return attachTags(rows.map((r) => ({ ...r, tags: [] })));
}

export async function getAllResourcesAdmin(): Promise<Resource[]> {
  const { rows } = await pool.query(
    `SELECT r.*, u.name AS author_name
     FROM resources r
     JOIN "user" u ON u.id = r.author_id
     ORDER BY r.category, r.featured DESC, r.created_at DESC`,
  );
  return attachTags(rows.map((r) => ({ ...r, tags: [] })));
}

export async function getResourceById(id: string): Promise<Resource | null> {
  const { rows } = await pool.query(
    `SELECT r.*, u.name AS author_name
     FROM resources r
     JOIN "user" u ON u.id = r.author_id
     WHERE r.id = $1`,
    [id],
  );
  if (rows.length === 0) return null;
  const [resource] = await attachTags([{ ...rows[0], tags: [] }]);
  return resource;
}

export async function createResource(data: {
  title: string;
  url: string;
  description: string;
  author_id: string;
  author?: string | null;
  image?: string | null;
  category: ResourceCategory;
  featured?: boolean;
  status?: string;
  tags?: string[];
}): Promise<Resource> {
  const slug = await uniqueSlug(data.title);
  const { rows } = await pool.query(
    `INSERT INTO resources (title, slug, url, description, author, image, category, featured, status, author_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.title,
      slug,
      data.url,
      data.description,
      data.author ?? null,
      data.image ?? null,
      data.category,
      data.featured ?? false,
      data.status ?? "draft",
      data.author_id,
    ],
  );
  const resource = rows[0];

  if (data.tags?.length) {
    await syncResourceTags(resource.id, data.tags);
  }

  const { rows: userRows } = await pool.query(
    `SELECT name FROM "user" WHERE id = $1`,
    [data.author_id],
  );

  const [full] = await attachTags([
    { ...resource, author_name: userRows[0]?.name ?? "", tags: [] },
  ]);
  return full;
}

export async function updateResource(
  id: string,
  data: Partial<{
    title: string;
    url: string;
    description: string;
    author: string | null;
    image: string | null;
    category: ResourceCategory;
    featured: boolean;
    status: string;
    tags: string[];
  }>,
): Promise<Resource | null> {
  const existing = await getResourceById(id);
  if (!existing) return null;

  const title = data.title ?? existing.title;
  const slug =
    data.title && data.title !== existing.title
      ? await uniqueSlug(data.title, id)
      : existing.slug;

  const { rows } = await pool.query(
    `UPDATE resources
     SET title = $1, slug = $2, url = $3, description = $4, author = $5,
         image = $6, category = $7, featured = $8, status = $9, updated_at = now()
     WHERE id = $10
     RETURNING *`,
    [
      title,
      slug,
      data.url ?? existing.url,
      data.description ?? existing.description,
      data.author !== undefined ? data.author : existing.author,
      data.image !== undefined ? data.image : existing.image,
      data.category ?? existing.category,
      data.featured !== undefined ? data.featured : existing.featured,
      data.status ?? existing.status,
      id,
    ],
  );

  if (data.tags !== undefined) {
    await syncResourceTags(id, data.tags);
  }

  const [full] = await attachTags([
    { ...rows[0], author_name: existing.author_name, tags: [] },
  ]);
  return full;
}

export async function deleteResource(id: string): Promise<void> {
  await pool.query(`DELETE FROM resources WHERE id = $1`, [id]);
}

async function syncResourceTags(
  resourceId: string,
  tagNames: string[],
): Promise<void> {
  await pool.query(`DELETE FROM resource_tag_map WHERE resource_id = $1`, [
    resourceId,
  ]);

  for (const name of tagNames) {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) continue;

    const tagSlug = slugify(trimmed);
    const { rows } = await pool.query(
      `INSERT INTO resource_tags (name, slug) VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [trimmed, tagSlug],
    );
    await pool.query(
      `INSERT INTO resource_tag_map (resource_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [resourceId, rows[0].id],
    );
  }
}
