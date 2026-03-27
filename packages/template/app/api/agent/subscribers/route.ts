import { requireApiKey } from "@/lib/require-api-key";
import { resend } from "@/lib/resend";
import { NextResponse } from "next/server";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export async function POST(request: Request) {
  const auth = await requireApiKey(request);
  if (!auth.ok) return auth.response;

  const data = await request.json();

  if (!data.email || typeof data.email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!AUDIENCE_ID) {
    return NextResponse.json(
      { error: "Newsletter is not configured" },
      { status: 500 },
    );
  }

  const firstName = data.name?.trim().split(" ")[0] || undefined;
  const lastName = data.name?.trim().split(" ").slice(1).join(" ") || undefined;

  await resend.contacts.create({
    audienceId: AUDIENCE_ID,
    email: data.email,
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
