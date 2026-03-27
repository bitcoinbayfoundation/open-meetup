import { resend, isResendConfigured } from "@/lib/resend";
import { NextResponse } from "next/server";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export async function POST(request: Request) {
  try {
    if (!isResendConfigured || !AUDIENCE_ID) {
      return NextResponse.json(
        { error: "Newsletter is not configured yet. Set RESEND_API_KEY and RESEND_AUDIENCE_ID in your .env file to enable email subscriptions via Resend." },
        { status: 503 },
      );
    }

    const { name, email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const firstName = name ? name.trim().split(" ")[0] : undefined;
    const lastName = name ? name.trim().split(" ").slice(1).join(" ") || undefined : undefined;

    await resend.contacts.create({
      audienceId: AUDIENCE_ID,
      email,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
