import { NextResponse } from "next/server";
import crypto from "crypto";

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;

function verifySlackSignature(
  signature: string,
  timestamp: string,
  body: string,
): boolean {
  const baseString = `v0:${timestamp}:${body}`;
  const hmac = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(baseString)
    .digest("hex");
  const expected = `v0=${hmac}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp") || "";
  const signature = request.headers.get("x-slack-signature") || "";

  // Reject requests older than 5 minutes (replay protection)
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return NextResponse.json({ error: "Request too old" }, { status: 403 });
  }

  // Verify signature
  if (!SIGNING_SECRET || !verifySlackSignature(signature, timestamp, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const payload = JSON.parse(body);

  // Handle Slack URL verification challenge
  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  // Handle event callbacks
  if (payload.type === "event_callback") {
    const event = payload.event;

    // Ignore bot messages to prevent loops
    if (event.bot_id || event.subtype === "bot_message") {
      return NextResponse.json({ ok: true });
    }

    // Log for now — extend with handlers as needed
    console.log("Slack event received:", event.type, event.text?.slice(0, 100));
  }

  return NextResponse.json({ ok: true });
}
