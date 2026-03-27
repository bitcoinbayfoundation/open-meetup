import { NextResponse } from "next/server";
import { ZapriteApi } from "@zaprite/api";
import { randomUUID } from "crypto";
import config from "@/site.config";

const apiKey = process.env.ZAPRITE_API_KEY;
const zaprite = apiKey ? new ZapriteApi({ apiKey }) : null;

export async function POST(request: Request) {
  try {
    if (!zaprite) {
      return NextResponse.json(
        { error: "Donations are not configured yet. Set ZAPRITE_API_KEY in your .env file to enable Bitcoin donations via Zaprite." },
        { status: 503 },
      );
    }

    const { amount, name, email } = await request.json();

    const cents = Math.round(Number(amount) * 100);
    if (!cents || cents < 100) {
      return NextResponse.json(
        { error: "Minimum donation is $1.00" },
        { status: 400 }
      );
    }

    const baseUrl = config.url;
    const donationId = `don_${randomUUID().replace(/-/g, "").slice(0, 16)}`;

    const result = await zaprite.orderCreate({
      body: {
        amount: cents,
        currency: "USD",
        label: `Donation — $${(cents / 100).toFixed(2)}`,
        externalUniqId: donationId,
        redirectUrl: `${baseUrl}/donate/thank-you?order=${donationId}`,
        tags: ["donation", "website"],
        ...(name || email
          ? {
              customerData: {
                ...(name ? { name } : {}),
                ...(email ? { email } : {}),
              },
              customerFields: {
                name: "OPTIONAL",
                email: "OPTIONAL",
              },
            }
          : {
              customerFields: {
                name: "OPTIONAL",
                email: "OPTIONAL",
              },
            }),
      },
    });

    if (result.error) {
      const msg =
        (result.error as { message?: string }).message ?? "Failed to create order";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({
      checkoutUrl: result.data!.checkoutUrl,
      orderId: result.data!.id,
    });
  } catch (error) {
    console.error("Donate API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
