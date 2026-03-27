import { NextResponse } from "next/server";
import { ZapriteApi } from "@zaprite/api";

const zaprite = new ZapriteApi({
  apiKey: process.env.ZAPRITE_API_KEY!,
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("id");

  if (!orderId) {
    return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
  }

  try {
    const result = await zaprite.orderGetById({ path: { id: orderId } });

    if (result.error || !result.data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = result.data;

    // Only return safe public fields
    return NextResponse.json({
      amount: order.totalAmount,
      currency: order.currency,
      status: order.status,
      label: order.label,
      paidAt: order.paidAt,
      method: order.transactions
        .filter((t) => t.status === "CONFIRMED")
        .map((t) => t.method)[0] ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
