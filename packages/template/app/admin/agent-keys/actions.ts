"use server";

import { requireAdmin } from "@/lib/require-admin";
import { pool } from "@/lib/db";

export async function getKeyUserMap(): Promise<
  Record<string, { userId: string; userName: string }>
> {
  await requireAdmin();

  const { rows } = await pool.query(
    `SELECT aku.api_key_id, aku.user_id, u.name AS user_name
     FROM api_key_users aku
     JOIN "user" u ON u.id = aku.user_id`,
  );

  const map: Record<string, { userId: string; userName: string }> = {};
  for (const row of rows) {
    map[row.api_key_id] = { userId: row.user_id, userName: row.user_name };
  }
  return map;
}

export async function setKeyUser(
  apiKeyId: string,
  userId: string | null,
): Promise<{ userName: string | null }> {
  await requireAdmin();

  if (!userId) {
    await pool.query(`DELETE FROM api_key_users WHERE api_key_id = $1`, [
      apiKeyId,
    ]);
    return { userName: null };
  }

  await pool.query(
    `INSERT INTO api_key_users (api_key_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (api_key_id) DO UPDATE SET user_id = $2`,
    [apiKeyId, userId],
  );

  const { rows } = await pool.query(`SELECT name FROM "user" WHERE id = $1`, [
    userId,
  ]);

  return { userName: rows[0]?.name ?? null };
}
