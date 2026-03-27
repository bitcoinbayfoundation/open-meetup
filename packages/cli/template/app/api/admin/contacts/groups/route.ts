import { auth } from "@/lib/auth";
import { pool } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await pool.query(
    `SELECT g.id, g.name, g.created_at, COUNT(m.contact_id)::int AS member_count
     FROM contact_groups g
     LEFT JOIN contact_group_members m ON m.group_id = g.id
     GROUP BY g.id
     ORDER BY g.name`,
  );

  return NextResponse.json({ groups: rows });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO contact_groups (name) VALUES ($1) RETURNING *`,
    [name.trim()],
  );

  return NextResponse.json(rows[0], { status: 201 });
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name } = await request.json();
  if (!id || !name?.trim()) {
    return NextResponse.json({ error: "ID and name required" }, { status: 400 });
  }

  await pool.query(`UPDATE contact_groups SET name = $1 WHERE id = $2`, [name.trim(), id]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Group ID required" }, { status: 400 });
  }

  await pool.query(`DELETE FROM contact_groups WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
