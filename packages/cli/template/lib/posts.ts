import { pool, isDbConfigured } from "./db";

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  author_id: string;
  author_name: string;
  featured_image: string | null;
  featured: boolean;
  status: "draft" | "published";
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

async function uniqueSlug(
  table: string,
  title: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let i = 2;

  while (true) {
    const { rows } = await pool.query(
      excludeId
        ? `SELECT id FROM ${table} WHERE slug = $1 AND id != $2`
        : `SELECT id FROM ${table} WHERE slug = $1`,
      excludeId ? [slug, excludeId] : [slug],
    );
    if (rows.length === 0) return slug;
    slug = `${base}-${i++}`;
  }
}

async function attachTags(posts: Post[]): Promise<Post[]> {
  if (posts.length === 0) return posts;
  const ids = posts.map((p) => p.id);
  const { rows } = await pool.query(
    `SELECT pt.post_id, t.id, t.name, t.slug
     FROM post_tags pt
     JOIN tags t ON t.id = pt.tag_id
     WHERE pt.post_id = ANY($1)`,
    [ids],
  );
  const tagMap = new Map<string, Tag[]>();
  for (const row of rows) {
    const list = tagMap.get(row.post_id) ?? [];
    list.push({ id: row.id, name: row.name, slug: row.slug });
    tagMap.set(row.post_id, list);
  }
  return posts.map((p) => ({ ...p, tags: tagMap.get(p.id) ?? [] }));
}

export async function getPublishedPosts(tag?: string): Promise<Post[]> {
  if (!isDbConfigured) return [];
  let query = `
    SELECT p.*, u.name AS author_name
    FROM posts p
    JOIN "user" u ON u.id = p.author_id
    WHERE p.status = 'published'
      AND (p.published_at IS NULL OR p.published_at <= now())
  `;
  const params: string[] = [];

  if (tag) {
    params.push(tag);
    query += `
      AND EXISTS (
        SELECT 1 FROM post_tags pt
        JOIN tags t ON t.id = pt.tag_id
        WHERE pt.post_id = p.id AND t.slug = $1
      )
    `;
  }

  query += ` ORDER BY p.featured DESC, p.created_at DESC`;

  const { rows } = await pool.query(query, params);
  return attachTags(rows.map((r) => ({ ...r, tags: [] })));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { rows } = await pool.query(
    `SELECT p.*, u.name AS author_name
     FROM posts p
     JOIN "user" u ON u.id = p.author_id
     WHERE p.slug = $1 AND p.status = 'published'
       AND (p.published_at IS NULL OR p.published_at <= now())`,
    [slug],
  );
  if (rows.length === 0) return null;
  const [post] = await attachTags([{ ...rows[0], tags: [] }]);
  return post;
}

export async function getAllPostsAdmin(): Promise<Post[]> {
  const { rows } = await pool.query(
    `SELECT p.*, u.name AS author_name
     FROM posts p
     JOIN "user" u ON u.id = p.author_id
     ORDER BY p.created_at DESC`,
  );
  return attachTags(rows.map((r) => ({ ...r, tags: [] })));
}

export async function getPostById(id: string): Promise<Post | null> {
  const { rows } = await pool.query(
    `SELECT p.*, u.name AS author_name
     FROM posts p
     JOIN "user" u ON u.id = p.author_id
     WHERE p.id = $1`,
    [id],
  );
  if (rows.length === 0) return null;
  const [post] = await attachTags([{ ...rows[0], tags: [] }]);
  return post;
}

export async function createPost(data: {
  title: string;
  body: string;
  author_id: string;
  excerpt?: string | null;
  featured_image?: string | null;
  featured?: boolean;
  status?: string;
  published_at?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: string | null;
  tags?: string[];
}): Promise<Post> {
  const slug = await uniqueSlug("posts", data.title);
  const { rows } = await pool.query(
    `INSERT INTO posts (title, slug, body, excerpt, author_id, featured_image, featured, status, published_at, meta_title, meta_description, og_image)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      data.title,
      slug,
      data.body,
      data.excerpt ?? null,
      data.author_id,
      data.featured_image ?? null,
      data.featured ?? false,
      data.status ?? "draft",
      data.published_at ?? null,
      data.meta_title ?? null,
      data.meta_description ?? null,
      data.og_image ?? null,
    ],
  );
  const post = rows[0];

  if (data.tags?.length) {
    await syncPostTags(post.id, data.tags);
  }

  const { rows: userRows } = await pool.query(
    `SELECT name FROM "user" WHERE id = $1`,
    [post.author_id],
  );

  const [full] = await attachTags([
    { ...post, author_name: userRows[0]?.name ?? "", tags: [] },
  ]);
  return full;
}

export async function updatePost(
  id: string,
  data: Partial<{
    title: string;
    body: string;
    excerpt: string | null;
    featured_image: string | null;
    featured: boolean;
    status: string;
    published_at: string | null;
    meta_title: string | null;
    meta_description: string | null;
    og_image: string | null;
    tags: string[];
    author_id: string;
  }>,
): Promise<Post | null> {
  const existing = await getPostById(id);
  if (!existing) return null;

  const title = data.title ?? existing.title;
  const slug =
    data.title && data.title !== existing.title
      ? await uniqueSlug("posts", data.title, id)
      : existing.slug;

  const authorId = data.author_id ?? existing.author_id;

  const { rows } = await pool.query(
    `UPDATE posts
     SET title = $1, slug = $2, body = $3, excerpt = $4, featured_image = $5,
         featured = $6, status = $7, published_at = $8, meta_title = $9,
         meta_description = $10, og_image = $11, author_id = $12, updated_at = now()
     WHERE id = $13
     RETURNING *`,
    [
      title,
      slug,
      data.body ?? existing.body,
      data.excerpt !== undefined ? data.excerpt : existing.excerpt,
      data.featured_image !== undefined
        ? data.featured_image
        : existing.featured_image,
      data.featured !== undefined ? data.featured : existing.featured,
      data.status ?? existing.status,
      data.published_at !== undefined
        ? data.published_at
        : existing.published_at,
      data.meta_title !== undefined ? data.meta_title : existing.meta_title,
      data.meta_description !== undefined
        ? data.meta_description
        : existing.meta_description,
      data.og_image !== undefined ? data.og_image : existing.og_image,
      authorId,
      id,
    ],
  );

  if (data.tags !== undefined) {
    await syncPostTags(id, data.tags);
  }

  // Resolve the author name for the (possibly changed) author
  const { rows: userRows } = await pool.query(
    `SELECT name FROM "user" WHERE id = $1`,
    [authorId],
  );

  const [full] = await attachTags([
    { ...rows[0], author_name: userRows[0]?.name ?? "", tags: [] },
  ]);
  return full;
}

export async function deletePost(id: string): Promise<void> {
  await pool.query(`DELETE FROM posts WHERE id = $1`, [id]);
}

// --- Tags ---

async function syncPostTags(
  postId: string,
  tagNames: string[],
): Promise<void> {
  await pool.query(`DELETE FROM post_tags WHERE post_id = $1`, [postId]);

  for (const name of tagNames) {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) continue;

    const tagSlug = slugify(trimmed);
    const { rows } = await pool.query(
      `INSERT INTO tags (name, slug) VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [trimmed, tagSlug],
    );
    await pool.query(
      `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [postId, rows[0].id],
    );
  }
}

export async function getAllTags(): Promise<Tag[]> {
  const { rows } = await pool.query(
    `SELECT t.*, COUNT(pt.post_id) AS post_count
     FROM tags t
     LEFT JOIN post_tags pt ON pt.tag_id = t.id
     GROUP BY t.id
     ORDER BY t.name`,
  );
  return rows;
}
