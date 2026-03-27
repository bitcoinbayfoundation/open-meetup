import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const contactId = searchParams.get("contactId");

  if (contactId) {
    const { rows } = await pool.query(
      `SELECT group_id FROM contact_group_members WHERE contact_id = $1`,
      [contactId],
    );
    return NextResponse.json({ groupIds: rows.map((r) => r.group_id) });
  }

  if (groupId) {
    const { rows } = await pool.query(
      `SELECT contact_id FROM contact_group_members WHERE group_id = $1`,
      [groupId],
    );
    return NextResponse.json({ contactIds: rows.map((r) => r.contact_id) });
  }

  const { rows } = await pool.query(`SELECT * FROM contact_group_members`);
  return NextResponse.json({ members: rows });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, contactIds } = await request.json();
  if (!groupId || !contactIds?.length) {
    return NextResponse.json({ error: "groupId and contactIds required" }, { status: 400 });
  }

  const values = (contactIds as string[])
    .map((_, i) => `($1, $${i + 2})`)
    .join(", ");
  await pool.query(
    `INSERT INTO contact_group_members (group_id, contact_id) VALUES ${values} ON CONFLICT DO NOTHING`,
    [groupId, ...contactIds],
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, contactIds } = await request.json();
  if (!groupId || !contactIds?.length) {
    return NextResponse.json({ error: "groupId and contactIds required" }, { status: 400 });
  }

  const placeholders = (contactIds as string[])
    .map((_, i) => `$${i + 2}`)
    .join(", ");
  await pool.query(
    `DELETE FROM contact_group_members WHERE group_id = $1 AND contact_id IN (${placeholders})`,
    [groupId, ...contactIds],
  );

  return NextResponse.json({ ok: true });
}
