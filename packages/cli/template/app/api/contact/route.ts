import { NextResponse } from "next/server";
import { resend, isResendConfigured } from "@/lib/resend";
import { sendNotification, isNotificationsConfigured } from "@/lib/notify";
import config from "@/site.config";

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export async function POST(request: Request) {
  try {
    if (!isNotificationsConfigured && !isResendConfigured) {
      return NextResponse.json(
        { error: "Contact form is not configured yet. Set up notifications (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID, or SLACK_BOT_TOKEN) and/or RESEND_API_KEY in your .env file." },
        { status: 503 },
      );
    }

    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    if (!email.includes("@") || !email.includes(".")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    // Send notification
    const now = new Date();
    const text = [
      `📩 *New contact from ${config.contact.domain}*`,
      ``,
      `*From:* ${name} (${email})`,
      `*Date:* ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      ``,
      `> ${message.replace(/\n/g, "\n> ")}`,
    ].join("\n");

    await sendNotification(text);

    // Subscribe to newsletter
    if (AUDIENCE_ID && isResendConfigured) {
      const firstName = name.trim().split(" ")[0];
      const lastName = name.trim().split(" ").slice(1).join(" ") || undefined;

      await resend.contacts.create({
        audienceId: AUDIENCE_ID,
        email,
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
