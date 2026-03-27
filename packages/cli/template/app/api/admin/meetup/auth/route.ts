import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code, redirectUri } = await request.json();

  const clientId = process.env.MEETUP_CLIENT_ID;
  const clientSecret = process.env.MEETUP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error:
          "MEETUP_CLIENT_ID and MEETUP_CLIENT_SECRET must be set in your environment variables before exchanging tokens.",
      },
      { status: 400 },
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "Authorization code is required." },
      { status: 400 },
    );
  }

  try {
    const res = await fetch("https://secure.meetup.com/oauth2/access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json(
        {
          error:
            data.error_description ??
            data.error ??
            "Failed to exchange code for tokens.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Token exchange failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}
