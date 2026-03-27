import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/notify";
import { ZapriteApi } from "@zaprite/api";

const zaprite = new ZapriteApi({
  apiKey: process.env.ZAPRITE_API_KEY!,
});

const PAID_STATUSES = new Set(["PAID", "COMPLETE", "OVERPAID"]);

const BTC_METHODS = new Set(["BITCOIN", "LIGHTNING", "LIQUID"]);

function formatAmount(amount: number, currency: string): string {
  if (currency === "BTC" || currency === "LBTC") {
    return `${amount.toLocaleString()} sats`;
  }
  return `$${(amount / 100).toFixed(2)} ${currency}`;
}

function methodEmoji(method: string): string {
  if (BTC_METHODS.has(method)) return "₿";
  if (method === "CARD") return "💳";
  if (method === "CASH") return "💵";
  return "💰";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Log the full raw payload so we can see exactly what Zaprite sends
    console.log("[zaprite-webhook] raw payload:", JSON.stringify(body));

    const eventType = body.eventType ?? body.event_type ?? body.type;
    const orderId = body.orderId ?? body.order_id ?? body.data?.orderId;
    const orgId = body.orgId ?? body.org_id;

    console.log("[zaprite-webhook] parsed:", { eventType, orderId, orgId });

    // Only handle order changes
    if (eventType !== "order.change" || !orderId) {
      console.log("[zaprite-webhook] ignoring event:", eventType);
      return NextResponse.json({ ok: true });
    }

    // Fetch the full order to check status
    console.log("[zaprite-webhook] fetching order:", orderId);
    const result = await zaprite.orderGetById({ path: { id: orderId } });
    if (result.error || !result.data) {
      console.error("[zaprite-webhook] failed to fetch order:", orderId, result.error);
      return NextResponse.json({ ok: true });
    }

    const order = result.data;
    console.log("[zaprite-webhook] order status:", order.status, "type:", order.orderType, "amount:", order.totalAmount, order.currency);

    // Only notify on paid events
    if (!PAID_STATUSES.has(order.status)) {
      console.log("[zaprite-webhook] skipping non-paid status:", order.status);
      return NextResponse.json({ ok: true });
    }

    // Build the Slack message
    const customer =
      order.customerData?.name ||
      (order.contact as { displayName?: string; legalName?: string } | null)
        ?.displayName ||
      (order.contact as { legalName?: string } | null)?.legalName ||
      order.customerData?.email ||
      "Anonymous";

    const label =
      order.label ||
      (order.paymentLink as { title?: string } | null)?.title ||
      (order.invoice as { title?: string; number?: string } | null)?.title ||
      (order.invoice as { number?: string } | null)?.number ||
      order.orderType;

    const confirmedTxs = order.transactions.filter(
      (t) => t.status === "CONFIRMED"
    );
    const methods = [
      ...new Set(confirmedTxs.map((t) => t.method)),
    ];
    const primaryMethod = methods[0] ?? "unknown";
    const isBtcPayment = methods.some((m) => BTC_METHODS.has(m));

    const statusText =
      order.status === "OVERPAID"
        ? "overpaid"
        : order.status === "COMPLETE"
          ? "completed"
          : "paid";

    // Sats line for BTC payments
    let satsLine = "";
    if (isBtcPayment) {
      const totalSats = confirmedTxs
        .filter(
          (t) =>
            BTC_METHODS.has(t.method) &&
            (t.currency === "BTC" || t.currency === "LBTC")
        )
        .reduce((sum, t) => sum + t.amount, 0);
      if (totalSats > 0) {
        satsLine = `  ·  ${totalSats.toLocaleString()} sats`;
      }
    }

    const ts = Math.floor(Date.now() / 1000);

    console.log("[zaprite-webhook] sending notification:", {
      statusText,
      amount: formatAmount(order.totalAmount, order.currency),
      customer,
      label,
      methods,
    });

    const text = [
      `${methodEmoji(primaryMethod)} *Payment ${statusText}* — *${formatAmount(order.totalAmount, order.currency)}*${satsLine}`,
      ``,
      `*Label:* ${label}`,
      `*Customer:* ${customer}`,
      `*Method:* ${methods.map((m) => m.toLowerCase()).join(", ")}`,
      `*Type:* ${order.orderType}`,
      ...(order.customerData?.email ? [`*Email:* ${order.customerData.email}`] : []),
      ``,
      `${new Date().toLocaleString()} · ${order.checkoutUrl}`,
    ].join("\n");

    await sendNotification(text);

    console.log("[zaprite-webhook] notification sent successfully");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[zaprite-webhook] error:", error);
    // Always return 200 so Zaprite doesn't retry
    return NextResponse.json({ ok: true });
  }
}
