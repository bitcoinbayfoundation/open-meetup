import { auth } from "@/lib/auth";
import { resend } from "@/lib/resend";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!AUDIENCE_ID) {
    return NextResponse.json(
      { error: "RESEND_AUDIENCE_ID not configured" },
      { status: 500 },
    );
  }

  const { data, error } = await resend.contacts.list({ audienceId: AUDIENCE_ID });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contacts: data?.data ?? [] });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!AUDIENCE_ID) {
    return NextResponse.json(
      { error: "RESEND_AUDIENCE_ID not configured" },
      { status: 500 },
    );
  }

  const { email, firstName, lastName } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { data, error } = await resend.contacts.create({
    audienceId: AUDIENCE_ID,
    email,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!AUDIENCE_ID) {
    return NextResponse.json(
      { error: "RESEND_AUDIENCE_ID not configured" },
      { status: 500 },
    );
  }

  const { id, firstName, lastName, unsubscribed } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Contact ID required" }, { status: 400 });
  }

  const { data, error } = await resend.contacts.update({
    audienceId: AUDIENCE_ID,
    id,
    firstName: firstName ?? undefined,
    lastName: lastName ?? undefined,
    unsubscribed: unsubscribed ?? undefined,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!AUDIENCE_ID) {
    return NextResponse.json(
      { error: "RESEND_AUDIENCE_ID not configured" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("id");

  if (!contactId) {
    return NextResponse.json({ error: "Contact ID required" }, { status: 400 });
  }

  const { error } = await resend.contacts.remove({
    audienceId: AUDIENCE_ID,
    id: contactId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
