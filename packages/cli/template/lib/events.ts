import { pool, isDbConfigured } from "./db";
import { slugify } from "./posts";

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  hosts: string | null;
  start_at: string;
  end_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  image: string | null;
  meetup_url: string | null;
  is_free: boolean;
  price: string | null;
  status: "draft" | "published";
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  author_id: string;
  author_name: string;
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
        ? `SELECT id FROM events WHERE slug = $1 AND id != $2`
        : `SELECT id FROM events WHERE slug = $1`,
      excludeId ? [slug, excludeId] : [slug],
    );
    if (rows.length === 0) return slug;
    slug = `${base}-${i++}`;
  }
}

export async function getUpcomingEvents(): Promise<(Event & { rsvp_count: number })[]> {
  if (!isDbConfigured) return [];
  const { rows } = await pool.query(
    `SELECT e.*, u.name AS author_name,
            (SELECT COUNT(*)::int FROM event_rsvps r WHERE r.event_id = e.id) AS rsvp_count
     FROM events e
     JOIN "user" u ON u.id = e.author_id
     WHERE e.status = 'published' AND e.start_at >= now()
     ORDER BY e.start_at ASC`,
  );
  return rows;
}

export async function getPastEvents(): Promise<(Event & { rsvp_count: number })[]> {
  if (!isDbConfigured) return [];
  const { rows } = await pool.query(
    `SELECT e.*, u.name AS author_name,
            (SELECT COUNT(*)::int FROM event_rsvps r WHERE r.event_id = e.id) AS rsvp_count
     FROM events e
     JOIN "user" u ON u.id = e.author_id
     WHERE e.status = 'published' AND e.start_at < now()
     ORDER BY e.start_at DESC`,
  );
  return rows;
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const { rows } = await pool.query(
    `SELECT e.*, u.name AS author_name
     FROM events e
     JOIN "user" u ON u.id = e.author_id
     WHERE e.slug = $1 AND e.status = 'published'`,
    [slug],
  );
  return rows[0] ?? null;
}

export async function getAllEventsAdmin(): Promise<Event[]> {
  const { rows } = await pool.query(
    `SELECT e.*, u.name AS author_name
     FROM events e
     JOIN "user" u ON u.id = e.author_id
     ORDER BY e.start_at DESC`,
  );
  return rows;
}

export async function getEventById(id: string): Promise<Event | null> {
  const { rows } = await pool.query(
    `SELECT e.*, u.name AS author_name
     FROM events e
     JOIN "user" u ON u.id = e.author_id
     WHERE e.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createEvent(data: {
  title: string;
  description: string;
  author_id: string;
  hosts?: string | null;
  start_at: string;
  end_at?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  image?: string | null;
  meetup_url?: string | null;
  is_free?: boolean;
  price?: string | null;
  status?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: string | null;
}): Promise<Event> {
  const slug = await uniqueSlug(data.title);
  const { rows } = await pool.query(
    `INSERT INTO events (title, slug, description, hosts, start_at, end_at, venue_name, venue_address, image, meetup_url, is_free, price, status, meta_title, meta_description, og_image, author_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING *`,
    [
      data.title,
      slug,
      data.description,
      data.hosts ?? null,
      data.start_at,
      data.end_at ?? null,
      data.venue_name ?? null,
      data.venue_address ?? null,
      data.image ?? null,
      data.meetup_url ?? null,
      data.is_free ?? true,
      data.price ?? null,
      data.status ?? "draft",
      data.meta_title ?? null,
      data.meta_description ?? null,
      data.og_image ?? null,
      data.author_id,
    ],
  );

  const { rows: userRows } = await pool.query(
    `SELECT name FROM "user" WHERE id = $1`,
    [data.author_id],
  );

  return { ...rows[0], author_name: userRows[0]?.name ?? "" };
}

export async function updateEvent(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    hosts: string | null;
    start_at: string;
    end_at: string | null;
    venue_name: string | null;
    venue_address: string | null;
    image: string | null;
    meetup_url: string | null;
    is_free: boolean;
    price: string | null;
    status: string;
    meta_title: string | null;
    meta_description: string | null;
    og_image: string | null;
  }>,
): Promise<Event | null> {
  const existing = await getEventById(id);
  if (!existing) return null;

  const title = data.title ?? existing.title;
  const slug =
    data.title && data.title !== existing.title
      ? await uniqueSlug(data.title, id)
      : existing.slug;

  const { rows } = await pool.query(
    `UPDATE events
     SET title = $1, slug = $2, description = $3, hosts = $4, start_at = $5,
         end_at = $6, venue_name = $7, venue_address = $8, image = $9,
         meetup_url = $10, is_free = $11, price = $12, status = $13,
         meta_title = $14, meta_description = $15, og_image = $16, updated_at = now()
     WHERE id = $17
     RETURNING *`,
    [
      title,
      slug,
      data.description ?? existing.description,
      data.hosts !== undefined ? data.hosts : existing.hosts,
      data.start_at ?? existing.start_at,
      data.end_at !== undefined ? data.end_at : existing.end_at,
      data.venue_name !== undefined ? data.venue_name : existing.venue_name,
      data.venue_address !== undefined ? data.venue_address : existing.venue_address,
      data.image !== undefined ? data.image : existing.image,
      data.meetup_url !== undefined ? data.meetup_url : existing.meetup_url,
      data.is_free !== undefined ? data.is_free : existing.is_free,
      data.price !== undefined ? data.price : existing.price,
      data.status ?? existing.status,
      data.meta_title !== undefined ? data.meta_title : existing.meta_title,
      data.meta_description !== undefined ? data.meta_description : existing.meta_description,
      data.og_image !== undefined ? data.og_image : existing.og_image,
      id,
    ],
  );

  return { ...rows[0], author_name: existing.author_name };
}

export async function getEventByMeetupUrl(meetupUrl: string): Promise<Event | null> {
  const { rows } = await pool.query(
    `SELECT e.*, u.name AS author_name
     FROM events e
     JOIN "user" u ON u.id = e.author_id
     WHERE e.meetup_url = $1`,
    [meetupUrl],
  );
  return rows[0] ?? null;
}

export async function getEventsByMeetupUrls(meetupUrls: string[]): Promise<string[]> {
  if (meetupUrls.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT meetup_url FROM events WHERE meetup_url = ANY($1)`,
    [meetupUrls],
  );
  return rows.map((r) => r.meetup_url);
}

export async function deleteEvent(id: string): Promise<void> {
  await pool.query(`DELETE FROM events WHERE id = $1`, [id]);
}

// --- RSVPs ---

export interface Rsvp {
  id: string;
  event_id: string;
  name: string;
  created_at: string;
}

export async function getRsvps(eventId: string): Promise<Rsvp[]> {
  const { rows } = await pool.query(
    `SELECT * FROM event_rsvps WHERE event_id = $1 ORDER BY created_at ASC`,
    [eventId],
  );
  return rows;
}

export async function getRsvpCount(eventId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM event_rsvps WHERE event_id = $1`,
    [eventId],
  );
  return rows[0].count;
}

export async function clearRsvps(eventId: string): Promise<void> {
  await pool.query(`DELETE FROM event_rsvps WHERE event_id = $1`, [eventId]);
}

export async function addRsvp(eventId: string, name: string): Promise<Rsvp> {
  const { rows } = await pool.query(
    `INSERT INTO event_rsvps (event_id, name) VALUES ($1, $2) RETURNING *`,
    [eventId, name.trim()],
  );
  return rows[0];
}
