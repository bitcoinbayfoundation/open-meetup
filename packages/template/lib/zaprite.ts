import { ZapriteApi } from "@zaprite/api";

export const isZapriteConfigured = !!process.env.ZAPRITE_API_KEY;

const zaprite = isZapriteConfigured
  ? new ZapriteApi({ apiKey: process.env.ZAPRITE_API_KEY! })
  : (null as unknown as ZapriteApi);

export async function getOrders(opts: {
  page?: number;
  status?: string;
  search?: string;
  includePending?: boolean;
} = {}) {
  const query: Record<string, unknown> = {};
  if (opts.page) query.page = opts.page;
  if (opts.search) query.search = opts.search;
  if (opts.status) query.status = [opts.status];
  if (opts.includePending) query.includePending = "true";
  query.sortBy = "createdAt";
  query.sortOrder = "desc";

  const result = await zaprite.orderSearch({ query });
  if (result.error) {
    throw new Error(
      (result.error as { message?: string }).message ?? "Failed to fetch orders"
    );
  }
  return result.data!;
}

export async function getOrdersSummary() {
  // Fetch all non-pending orders across all pages to compute totals
  const allOrders: Array<{
    status: string;
    totalAmount: number;
    currency: string;
    transactions: Array<{
      method: string;
      amount: number;
      currency: string;
      status: string;
      amountInOrderCurrency: number | null;
      orderCurrency: string | null;
    }>;
  }> = [];

  let page = 1;
  let pagesCount = 1;

  // First pass: all non-pending (PAID, COMPLETE, OVERPAID, UNDERPAID, PROCESSING)
  do {
    const result = await zaprite.orderSearch({
      query: { page, sortBy: "createdAt", sortOrder: "desc" },
    });
    if (result.error) {
      throw new Error(
        (result.error as { message?: string }).message ?? "Failed to fetch orders"
      );
    }
    const data = result.data!;
    allOrders.push(...data.items);
    pagesCount = data.meta.pagesCount;
    page++;
  } while (page <= pagesCount);

  // Also get pending count (just first page for the meta count)
  const pendingResult = await zaprite.orderSearch({
    query: { status: ["PENDING"], includePending: "true" },
  });
  const pendingCount = pendingResult.data?.meta?.itemsCount ?? 0;

  // Compute stats — all revenue derived from confirmed transactions, not order totals
  const BTC_METHODS = new Set(["BITCOIN", "LIGHTNING", "LIQUID"]);
  const totalOrders = allOrders.length + pendingCount;
  const byStatus: Record<string, { count: number; amount: number }> = {};
  const byMethod: Record<string, number> = {};
  let fiatRevenueCents = 0;
  let btcRevenueCents = 0;   // USD-equivalent of BTC payments (in cents)
  let btcRevenueSats = 0;    // raw sats received across all BTC-method transactions
  let btcTxCount = 0;
  let fiatTxCount = 0;

  for (const order of allOrders) {
    const s = order.status;
    if (!byStatus[s]) byStatus[s] = { count: 0, amount: 0 };
    byStatus[s].count++;
    byStatus[s].amount += order.totalAmount;

    const isPaid = ["PAID", "COMPLETE", "OVERPAID"].includes(s);

    for (const tx of order.transactions) {
      if (tx.status !== "CONFIRMED") continue;

      const m = tx.method;
      if (!byMethod[m]) byMethod[m] = 0;
      byMethod[m]++;

      const isBtc = BTC_METHODS.has(m);
      if (isBtc) btcTxCount++;
      else fiatTxCount++;

      if (isPaid) {
        // Use amountInOrderCurrency (order's currency, e.g. cents for USD invoices paid in BTC)
        const amt = tx.amountInOrderCurrency ?? tx.amount;
        const cur = tx.orderCurrency ?? tx.currency;
        const isBtcCurrency = cur === "BTC" || cur === "LBTC";

        if (isBtc) {
          // Always track the raw sats sent
          if (tx.currency === "BTC" || tx.currency === "LBTC") {
            btcRevenueSats += tx.amount;
          }
          // Track the fiat-equivalent value
          if (isBtcCurrency) {
            // BTC-denominated order paid in BTC — no fiat equivalent
          } else {
            btcRevenueCents += amt;
          }
        } else {
          if (isBtcCurrency) {
            btcRevenueSats += amt;
          } else {
            fiatRevenueCents += amt;
          }
        }
      }
    }
  }

  const totalRevenueCents = fiatRevenueCents + btcRevenueCents;
  const totalTxCount = btcTxCount + fiatTxCount;
  const btcRatio = totalTxCount > 0 ? btcTxCount / totalTxCount : 0;

  return {
    totalOrders,
    pendingCount,
    byStatus,
    totalRevenueCents,
    fiatRevenueCents,
    btcRevenueCents,
    btcRevenueSats,
    byMethod,
    paidOrderCount: allOrders.length,
    btcTxCount,
    fiatTxCount,
    btcRatio,
  };
}

export async function getContacts(opts: { page?: number } = {}) {
  const query: Record<string, unknown> = {};
  if (opts.page) query.page = opts.page;

  const result = await zaprite.contactSearch({ query });
  if (result.error) {
    throw new Error(
      (result.error as { message?: string }).message ??
        "Failed to fetch contacts"
    );
  }
  return result.data!;
}
