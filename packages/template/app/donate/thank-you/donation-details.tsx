"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const BTC_METHODS = new Set(["BITCOIN", "LIGHTNING", "LIQUID"]);

function methodLabel(method: string): string {
  const map: Record<string, string> = {
    BITCOIN: "bitcoin (on-chain)",
    LIGHTNING: "lightning",
    LIQUID: "liquid",
    CARD: "card",
    BANK: "bank transfer",
    CASH: "cash",
    CASHAPP_PAY: "cash app",
    APPLEPAY: "apple pay",
    GOOGLEPAY: "google pay",
    ACH: "ach",
  };
  return map[method] ?? method.toLowerCase();
}

interface OrderInfo {
  amount: number;
  currency: string;
  status: string;
  label: string | null;
  paidAt: string | null;
  method: string | null;
}

export function DonationDetails() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [order, setOrder] = useState<OrderInfo | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/donate/order?id=${encodeURIComponent(orderId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setOrder(data); })
      .catch(() => {});
  }, [orderId]);

  if (!order) return null;

  const dollars = (order.amount / 100).toFixed(2);
  const isBtc = order.method ? BTC_METHODS.has(order.method) : false;

  return (
    <div className="border border-t-accent/25 bg-t-accent/[0.03] mb-12">
      <div className="p-5 border-b border-t-accent/15">
        <p className="font-mono text-[0.6rem] text-t-accent/50 uppercase tracking-wider mb-2">
          your donation
        </p>
        <p className="font-mono text-[2rem] text-t-accent font-bold tracking-tight">
          ${dollars}
        </p>
      </div>
      <div className="p-5 flex flex-wrap gap-x-8 gap-y-3">
        {order.method && (
          <div>
            <p className="font-mono text-[0.55rem] text-t-surface/35 uppercase tracking-wider mb-0.5">
              paid via
            </p>
            <p className={`font-mono text-[0.8rem] ${isBtc ? "text-t-accent" : "text-t-surface/70"}`}>
              {methodLabel(order.method)}
            </p>
          </div>
        )}
        {order.paidAt && (
          <div>
            <p className="font-mono text-[0.55rem] text-t-surface/35 uppercase tracking-wider mb-0.5">
              date
            </p>
            <p className="font-mono text-[0.8rem] text-t-surface/70">
              {new Date(order.paidAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        )}
        <div>
          <p className="font-mono text-[0.55rem] text-t-surface/35 uppercase tracking-wider mb-0.5">
            status
          </p>
          <p className="font-mono text-[0.8rem] text-green-400">
            {order.status === "COMPLETE" ? "complete" : order.status === "PAID" ? "paid" : order.status.toLowerCase()}
          </p>
        </div>
      </div>
    </div>
  );
}
