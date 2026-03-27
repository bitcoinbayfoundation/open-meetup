"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/* ── types (inline from SDK response shapes) ── */

interface Address {
  line1: string | null;
  line2: string | null;
  zipCode: string | null;
  city: string | null;
  state: string | null;
  countryCode: string | null;
}

interface Contact {
  id: string;
  legalName: string;
  contactName: string | null;
  displayName: string | null;
  email: string | null;
  taxId: string | null;
  defaultCurrency: string | null;
  billingAddress: Address | null;
  paymentProfiles: Array<{
    id: string;
    method: string;
    label: string;
  }>;
}

interface Transaction {
  id?: string;
  date: unknown;
  amount: number;
  currency: string;
  amountInOrderCurrency: number | null;
  orderCurrency: string | null;
  method: string;
  externalRef: string | null;
  status: string;
}

interface LineItem {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  quantity: number;
  taxRateBips: number;
  taxAmount: number;
  discountRateBips: number;
  discountAmount: number;
}

interface Order {
  id: string;
  orgId: string;
  orderType: string;
  totalAmount: number;
  currency: string;
  externalUniqId: string | null;
  status: string;
  paidAt: string | null;
  expiresAt: string | null;
  label: string | null;
  checkoutUrl: string;
  receiptPdfUrl: string | null;
  contact: Contact | null;
  invoice: {
    id: string;
    number: string;
    title: string | null;
    status: string;
    date: string;
    publicUrl: string;
    lineItems: LineItem[];
  } | null;
  paymentLink: { id: string; title: string } | null;
  transactions: Transaction[];
  customerData: {
    email: string | null;
    name: string | null;
    phone: string | null;
    address: Address | null;
    note: string | null;
    company: string | null;
    [key: string]: unknown;
  };
  metadata: Record<string, string>;
  tags: string[];
  eventTickets: Array<{
    id: string;
    paymentLinkItem: { id: string; title: string | null };
  }>;
  orderItems: Array<{
    id: string;
    label: string | null;
    quantity: number;
    paymentLinkItem: { id: string; title: string | null } | null;
  }>;
}

interface PaginationMeta {
  itemsCount: number;
  pagesCount: number;
  page: number;
  perPage: number;
}

/* ── helpers ── */

const BTC_CURRENCIES = new Set(["BTC", "LBTC"]);

function formatAmount(amount: number, currency: string): string {
  if (BTC_CURRENCIES.has(currency)) {
    if (amount >= 100_000_000) {
      return `${(amount / 100_000_000).toFixed(8)} ${currency}`;
    }
    return `${amount.toLocaleString()} sats`;
  }
  return `$${(amount / 100).toFixed(2)} ${currency}`;
}

function formatDate(iso: string | unknown): string {
  if (!iso || typeof iso !== "string") return "---";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string | unknown): string {
  if (!iso || typeof iso !== "string") return "---";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusColor(status: string) {
  switch (status) {
    case "PAID":
    case "COMPLETE":
    case "CONFIRMED":
      return "border-green-500/30 text-green-400";
    case "PENDING":
    case "PROCESSING":
      return "border-t-accent/40 text-t-accent";
    case "OVERPAID":
    case "UNDERPAID":
      return "border-t-accent-alt/40 text-t-accent-alt";
    case "CANCELED":
    case "ABANDONED":
      return "border-t-surface/20 text-t-surface/45";
    default:
      return "border-t-surface/20 text-t-surface/55";
  }
}

function methodLabel(method: string): string {
  const map: Record<string, string> = {
    BITCOIN: "bitcoin",
    LIGHTNING: "lightning",
    LIQUID: "liquid",
    BANK: "bank",
    CARD: "card",
    CASH: "cash",
    CHECK: "check",
    CASHAPP_PAY: "cashapp",
    APPLEPAY: "apple pay",
    GOOGLEPAY: "google pay",
    ACH: "ach",
    SEPA: "sepa",
    WIRE_TRANSFER: "wire",
    VENMO: "venmo",
    PAYPAL: "paypal",
    NO_CHARGE: "no charge",
    TETHER: "usdt",
    USDCIRCLE: "usdc",
  };
  return map[method] ?? method.toLowerCase();
}

function isBtcMethod(method: string): boolean {
  return ["BITCOIN", "LIGHTNING", "LIQUID"].includes(method);
}

function customerName(order: Order): string {
  return (
    order.customerData?.name ||
    order.contact?.displayName ||
    order.contact?.contactName ||
    order.contact?.legalName ||
    order.customerData?.email ||
    order.contact?.email ||
    "---"
  );
}

function primaryMethod(order: Order): string {
  if (!order.transactions.length) return "---";
  const methods = [...new Set(order.transactions.map((t) => t.method))];
  return methods.map(methodLabel).join(", ");
}

const STATUSES = [
  "",
  "PENDING",
  "PROCESSING",
  "PAID",
  "COMPLETE",
  "OVERPAID",
  "UNDERPAID",
  "ABANDONED",
] as const;

/* ── component ── */

export default function ZapriteAdmin() {
  const [activeTab, setActiveTab] = useState<"orders" | "contacts">("orders");

  // orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersMeta, setOrdersMeta] = useState<PaginationMeta | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [ordersPage, setOrdersPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // summary state
  interface Summary {
    totalOrders: number;
    pendingCount: number;
    paidOrderCount: number;
    totalRevenueCents: number;
    fiatRevenueCents: number;
    btcRevenueSats: number;
    byStatus: Record<string, { count: number; amount: number }>;
    byMethod: Record<string, number>;
    btcRevenueCents: number;
    btcTxCount: number;
    fiatTxCount: number;
    btcRatio: number;
  }
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsMeta, setContactsMeta] = useState<PaginationMeta | null>(
    null
  );
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState("");
  const [contactsPage, setContactsPage] = useState(1);
  const [contactSearch, setContactSearch] = useState("");
  const [contactsFetched, setContactsFetched] = useState(false);

  // status filter dropdown
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadOrders = useCallback(
    async (page: number, status: string, search: string) => {
      setOrdersLoading(true);
      setOrdersError("");
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        if (status) {
          params.set("status", status);
          if (status === "PENDING") {
            params.set("includePending", "true");
          }
        }
        if (search) params.set("search", search);
        const res = await fetch(`/api/admin/zaprite/orders?${params}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to load orders");
        }
        const data = await res.json();
        setOrders(data.items ?? []);
        setOrdersMeta(data.meta ?? null);
      } catch (err) {
        setOrdersError(
          err instanceof Error ? err.message : "Failed to load orders"
        );
      }
      setOrdersLoading(false);
    },
    []
  );

  const loadContacts = useCallback(async (page: number) => {
    setContactsLoading(true);
    setContactsError("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      const res = await fetch(`/api/admin/zaprite/contacts?${params}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to load contacts");
      }
      const data = await res.json();
      setContacts(data.items ?? []);
      setContactsMeta(data.meta ?? null);
    } catch (err) {
      setContactsError(
        err instanceof Error ? err.message : "Failed to load contacts"
      );
    }
    setContactsLoading(false);
  }, []);

  // Load summary on mount
  useEffect(() => {
    setSummaryLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/admin/zaprite/summary");
        if (res.ok) setSummary(await res.json());
      } catch {
        // summary is non-critical
      }
      setSummaryLoading(false);
    })();
  }, []);

  // Load orders on mount and when filters change
  useEffect(() => {
    loadOrders(ordersPage, statusFilter, searchQuery);
  }, [ordersPage, statusFilter, searchQuery, loadOrders]);

  // Load contacts when tab switches
  useEffect(() => {
    if (activeTab === "contacts" && !contactsFetched) {
      setContactsFetched(true);
      loadContacts(contactsPage);
    }
  }, [activeTab, contactsFetched, contactsPage, loadContacts]);

  useEffect(() => {
    if (contactsFetched) {
      loadContacts(contactsPage);
    }
  }, [contactsPage, contactsFetched, loadContacts]);

  function handleSearch(value: string) {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setOrdersPage(1);
      setSearchQuery(value);
    }, 400);
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value);
    setOrdersPage(1);
    setStatusOpen(false);
  }

  const filteredContacts = contactSearch
    ? contacts.filter(
        (c) =>
          (c.legalName ?? "")
            .toLowerCase()
            .includes(contactSearch.toLowerCase()) ||
          (c.displayName ?? "")
            .toLowerCase()
            .includes(contactSearch.toLowerCase()) ||
          (c.email ?? "").toLowerCase().includes(contactSearch.toLowerCase())
      )
    : contacts;

  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        {/* Terminal prompt */}
        <div className="font-mono text-[0.65rem] text-t-surface/65 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">cat /var/log/zaprite</span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(3rem,8vw,7rem)] mb-12">
          zaprite<span className="text-t-accent glow">.</span>
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-10">
          {(["orders", "contacts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-mono text-[0.72rem] lowercase px-5 py-2.5 border transition-colors cursor-pointer ${
                activeTab === tab
                  ? "text-t-accent border-t-accent bg-t-accent/5"
                  : "text-t-surface/55 border-t-surface/20 hover:border-t-surface/40 hover:text-t-surface/80"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            {/* Summary stats */}
            {summaryLoading ? (
              <p className="font-mono text-[0.75rem] text-t-surface/45 animate-pulse mb-8">
                computing totals across all orders...
              </p>
            ) : summary ? (
              <div className="mb-10 border border-t-surface/15">
                {/* Revenue headline */}
                <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-t-surface/10">
                  <div className="p-5 sm:border-r border-t-surface/10">
                    <p className="font-mono text-[0.55rem] text-t-surface/40 uppercase tracking-wider mb-1">total revenue</p>
                    <p className="font-mono text-[1.4rem] text-t-surface font-bold tracking-tight">
                      ${(summary.totalRevenueCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-5 sm:border-r border-t-surface/10">
                    <p className="font-mono text-[0.55rem] text-t-surface/40 uppercase tracking-wider mb-1">fiat payments</p>
                    <p className="font-mono text-[1.4rem] text-t-surface font-bold tracking-tight">
                      ${(summary.fiatRevenueCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-5 sm:border-r border-t-surface/10">
                    <p className="font-mono text-[0.55rem] text-t-accent/60 uppercase tracking-wider mb-1">bitcoin payments</p>
                    <p className="font-mono text-[1.4rem] text-t-accent font-bold tracking-tight">
                      {summary.btcRevenueSats >= 100_000_000
                        ? `₿ ${(summary.btcRevenueSats / 100_000_000).toFixed(8)}`
                        : `${summary.btcRevenueSats.toLocaleString()} sats`}
                    </p>
                    {summary.btcRevenueCents > 0 && (
                      <p className="font-mono text-[0.65rem] text-t-surface/40 mt-0.5">
                        ≈ ${(summary.btcRevenueCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </p>
                    )}
                  </div>
                  <div className="p-5 sm:border-r border-t-surface/10">
                    <p className="font-mono text-[0.55rem] text-t-accent/60 uppercase tracking-wider mb-1">bitcoin ratio</p>
                    <p className="font-mono text-[1.4rem] text-t-accent font-bold tracking-tight">
                      {(summary.btcRatio * 100).toFixed(1)}%
                    </p>
                    <p className="font-mono text-[0.6rem] text-t-surface/35 mt-0.5">
                      {summary.btcTxCount} btc / {summary.fiatTxCount} fiat
                    </p>
                  </div>
                  <div className="p-5">
                    <p className="font-mono text-[0.55rem] text-t-surface/40 uppercase tracking-wider mb-1">orders</p>
                    <p className="font-mono text-[1.4rem] text-t-surface font-bold tracking-tight">
                      {summary.paidOrderCount.toLocaleString()} <span className="text-[0.75rem] font-normal text-t-surface/40">/ {summary.totalOrders.toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                {/* Status + methods row */}
                <div className="p-4 flex flex-wrap items-center gap-2">
                  {Object.entries(summary.byStatus)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .map(([status, data]) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(statusFilter === status ? "" : status)}
                      className={`font-mono text-[0.65rem] lowercase px-2.5 py-1 border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        statusFilter === status
                          ? "border-t-accent bg-t-accent/10 text-t-accent"
                          : `${statusColor(status)} hover:bg-t-surface/5`
                      }`}
                    >
                      {status.toLowerCase()}
                      <span className="font-bold">{data.count}</span>
                    </button>
                  ))}
                  {summary.pendingCount > 0 && (
                    <button
                      onClick={() => handleStatusChange(statusFilter === "PENDING" ? "" : "PENDING")}
                      className={`font-mono text-[0.65rem] lowercase px-2.5 py-1 border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        statusFilter === "PENDING"
                          ? "border-t-accent bg-t-accent/10 text-t-accent"
                          : `${statusColor("PENDING")} hover:bg-t-surface/5`
                      }`}
                    >
                      pending
                      <span className="font-bold">{summary.pendingCount.toLocaleString()}</span>
                    </button>
                  )}

                  <span className="text-t-surface/15 mx-1">|</span>

                  {Object.entries(summary.byMethod)
                    .sort(([, a], [, b]) => b - a)
                    .map(([method, count]) => (
                      <span
                        key={method}
                        className={`font-mono text-[0.6rem] ${
                          isBtcMethod(method) ? "text-t-accent/70" : "text-t-surface/40"
                        }`}
                      >
                        {methodLabel(method)} <span className="font-semibold text-t-surface/60">{count}</span>
                      </span>
                    ))}
                </div>
              </div>
            ) : null}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="search orders..."
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 bg-transparent border border-t-surface/20 px-4 py-2.5 font-mono text-[0.75rem] text-t-surface placeholder:text-t-surface/35 focus:outline-none focus:border-t-accent/50"
              />
              <div className="relative" ref={statusRef}>
                <button
                  onClick={() => setStatusOpen(!statusOpen)}
                  className="w-full sm:w-auto bg-transparent border border-t-surface/20 px-4 py-2.5 font-mono text-[0.75rem] text-t-surface/70 hover:border-t-surface/40 transition-colors cursor-pointer flex items-center gap-2 min-w-[160px] justify-between"
                >
                  <span>{statusFilter || "all statuses"}</span>
                  <span className="text-t-surface/35 text-[0.6rem]">
                    ▼
                  </span>
                </button>
                {statusOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-t-dark border border-t-surface/20 z-20">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`w-full text-left px-4 py-2 font-mono text-[0.72rem] hover:bg-t-surface/5 transition-colors cursor-pointer ${
                          statusFilter === s
                            ? "text-t-accent"
                            : "text-t-surface/65"
                        }`}
                      >
                        {s || "all statuses"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error */}
            {ordersError && (
              <div className="border border-t-accent-alt/30 bg-t-accent-alt/5 px-4 py-3 mb-6">
                <p className="font-mono text-[0.75rem] text-t-accent-alt">
                  {ordersError}
                </p>
              </div>
            )}

            {/* Loading */}
            {ordersLoading && (
              <p className="font-mono text-[0.8rem] text-t-surface/55 animate-pulse mb-6">
                loading orders...
              </p>
            )}

            {/* Orders list */}
            {!ordersLoading && orders.length === 0 && (
              <p className="font-mono text-[0.8rem] text-t-surface/45">
                no orders found.
              </p>
            )}

            {!ordersLoading && orders.length > 0 && (
              <div className="border border-t-surface/20">
                {/* Header */}
                <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 border-b border-t-surface/15 bg-t-surface/3">
                  <span className="col-span-1 font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider">
                    status
                  </span>
                  <span className="col-span-2 font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider">
                    amount
                  </span>
                  <span className="col-span-3 font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider">
                    label
                  </span>
                  <span className="col-span-2 font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider">
                    customer
                  </span>
                  <span className="col-span-2 font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider">
                    method
                  </span>
                  <span className="col-span-2 font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider">
                    date
                  </span>
                </div>

                {orders.map((order) => (
                  <div key={order.id}>
                    <button
                      onClick={() =>
                        setExpandedId(
                          expandedId === order.id ? null : order.id
                        )
                      }
                      className="w-full grid grid-cols-2 md:grid-cols-12 gap-2 px-4 py-3 border-b border-t-surface/10 hover:bg-t-surface/3 transition-colors cursor-pointer text-left"
                    >
                      <div className="col-span-1 md:col-span-1 flex items-center">
                        <span
                          className={`font-mono text-[0.6rem] lowercase px-2 py-0.5 border ${statusColor(order.status)}`}
                        >
                          {order.status.toLowerCase()}
                        </span>
                      </div>
                      <div className="col-span-1 md:col-span-2 flex items-center">
                        <span className="font-mono text-[0.8rem] text-t-surface font-semibold">
                          {formatAmount(order.totalAmount, order.currency)}
                        </span>
                      </div>
                      <div className="col-span-2 md:col-span-3 flex items-center">
                        <span className="font-mono text-[0.75rem] text-t-surface/70 truncate">
                          {order.label ||
                            order.paymentLink?.title ||
                            order.invoice?.title ||
                            order.orderType}
                        </span>
                      </div>
                      <div className="hidden md:flex col-span-2 items-center">
                        <span className="font-mono text-[0.72rem] text-t-surface/55 truncate">
                          {customerName(order)}
                        </span>
                      </div>
                      <div className="hidden md:flex col-span-2 items-center">
                        <span
                          className={`font-mono text-[0.7rem] ${
                            order.transactions.some((t) =>
                              isBtcMethod(t.method)
                            )
                              ? "text-t-accent"
                              : "text-t-surface/55"
                          }`}
                        >
                          {primaryMethod(order)}
                        </span>
                      </div>
                      <div className="hidden md:flex col-span-2 items-center">
                        <span className="font-mono text-[0.7rem] text-t-surface/55">
                          {order.paidAt
                            ? formatDate(order.paidAt)
                            : order.transactions[0]?.date
                              ? formatDate(order.transactions[0].date)
                              : "---"}
                        </span>
                      </div>
                    </button>

                    {/* Expanded details */}
                    {expandedId === order.id && (
                      <OrderDetails order={order} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {ordersMeta && ordersMeta.pagesCount > 1 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setOrdersPage(Math.max(1, ordersPage - 1))}
                  disabled={ordersPage <= 1}
                  className="font-mono text-[0.72rem] border border-t-surface/20 px-4 py-2 text-t-surface/65 hover:border-t-surface/40 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← prev
                </button>
                <span className="font-mono text-[0.7rem] text-t-surface/45">
                  page {ordersMeta.page} of {ordersMeta.pagesCount}
                </span>
                <button
                  onClick={() =>
                    setOrdersPage(
                      Math.min(ordersMeta.pagesCount, ordersPage + 1)
                    )
                  }
                  disabled={ordersPage >= ordersMeta.pagesCount}
                  className="font-mono text-[0.72rem] border border-t-surface/20 px-4 py-2 text-t-surface/65 hover:border-t-surface/40 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === "contacts" && (
          <div>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="search contacts..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="flex-1 bg-transparent border border-t-surface/20 px-4 py-2.5 font-mono text-[0.75rem] text-t-surface placeholder:text-t-surface/35 focus:outline-none focus:border-t-accent/50"
              />
              <div className="font-mono text-[0.7rem] text-t-surface/45 flex items-center px-2">
                {contactsMeta?.itemsCount ?? "---"} contacts
              </div>
            </div>

            {contactsError && (
              <div className="border border-t-accent-alt/30 bg-t-accent-alt/5 px-4 py-3 mb-6">
                <p className="font-mono text-[0.75rem] text-t-accent-alt">
                  {contactsError}
                </p>
              </div>
            )}

            {contactsLoading && (
              <p className="font-mono text-[0.8rem] text-t-surface/55 animate-pulse mb-6">
                loading contacts...
              </p>
            )}

            {!contactsLoading && filteredContacts.length === 0 && (
              <p className="font-mono text-[0.8rem] text-t-surface/45">
                no contacts found.
              </p>
            )}

            {!contactsLoading && filteredContacts.length > 0 && (
              <div className="border border-t-surface/20">
                {/* Header */}
                <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-3 border-b border-t-surface/15 bg-t-surface/3">
                  <span className="col-span-4 font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider">
                    name
                  </span>
                  <span className="col-span-4 font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider">
                    email
                  </span>
                  <span className="col-span-2 font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider">
                    currency
                  </span>
                  <span className="col-span-2 font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider">
                    tax id
                  </span>
                </div>

                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="grid grid-cols-2 md:grid-cols-12 gap-2 px-4 py-3 border-b border-t-surface/10"
                  >
                    <div className="col-span-1 md:col-span-4">
                      <span className="font-mono text-[0.8rem] text-t-surface">
                        {contact.displayName ??
                          contact.contactName ??
                          contact.legalName}
                      </span>
                    </div>
                    <div className="col-span-1 md:col-span-4">
                      <span className="font-mono text-[0.75rem] text-t-surface/65">
                        {contact.email ?? "---"}
                      </span>
                    </div>
                    <div className="hidden md:block col-span-2">
                      <span className="font-mono text-[0.7rem] text-t-surface/55">
                        {contact.defaultCurrency ?? "---"}
                      </span>
                    </div>
                    <div className="hidden md:block col-span-2">
                      <span className="font-mono text-[0.7rem] text-t-surface/55">
                        {contact.taxId ?? "---"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {contactsMeta && contactsMeta.pagesCount > 1 && (
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() =>
                    setContactsPage(Math.max(1, contactsPage - 1))
                  }
                  disabled={contactsPage <= 1}
                  className="font-mono text-[0.72rem] border border-t-surface/20 px-4 py-2 text-t-surface/65 hover:border-t-surface/40 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← prev
                </button>
                <span className="font-mono text-[0.7rem] text-t-surface/45">
                  page {contactsMeta.page} of {contactsMeta.pagesCount}
                </span>
                <button
                  onClick={() =>
                    setContactsPage(
                      Math.min(contactsMeta.pagesCount, contactsPage + 1)
                    )
                  }
                  disabled={contactsPage >= contactsMeta.pagesCount}
                  className="font-mono text-[0.72rem] border border-t-surface/20 px-4 py-2 text-t-surface/65 hover:border-t-surface/40 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  next →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/* ── sub-components ── */

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-t-surface/20 p-4">
      <p className="font-mono text-[0.55rem] text-t-surface/45 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="font-mono text-[1rem] text-t-surface font-bold">
        {value}
      </p>
    </div>
  );
}

function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="border-b border-t-surface/10 bg-t-surface/[0.02] px-4 py-5">
      <div className="ml-4 border-l-2 border-t-accent pl-5 space-y-5">
        {/* Customer data */}
        {(order.customerData?.name ||
          order.customerData?.email ||
          order.customerData?.phone) && (
          <DetailSection label="customer">
            <div className="space-y-1">
              {order.customerData.name && (
                <p className="font-mono text-[0.8rem] text-t-surface">
                  {order.customerData.name}
                </p>
              )}
              {order.customerData.email && (
                <p className="font-mono text-[0.75rem] text-t-surface/65">
                  {order.customerData.email}
                </p>
              )}
              {order.customerData.phone && (
                <p className="font-mono text-[0.75rem] text-t-surface/55">
                  {order.customerData.phone}
                </p>
              )}
              {order.customerData.company && (
                <p className="font-mono text-[0.75rem] text-t-surface/55">
                  {order.customerData.company}
                </p>
              )}
              {order.customerData.address && (
                <p className="font-mono text-[0.7rem] text-t-surface/45">
                  {[
                    order.customerData.address.line1,
                    order.customerData.address.line2,
                    order.customerData.address.city,
                    order.customerData.address.state,
                    order.customerData.address.zipCode,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {order.customerData.note && (
                <p className="font-mono text-[0.7rem] text-t-surface/45 italic">
                  &quot;{order.customerData.note}&quot;
                </p>
              )}
            </div>
          </DetailSection>
        )}

        {/* Contact */}
        {order.contact && !order.customerData?.name && (
          <DetailSection label="contact">
            <p className="font-mono text-[0.8rem] text-t-surface">
              {order.contact.displayName ??
                order.contact.contactName ??
                order.contact.legalName}
            </p>
            {order.contact.email && (
              <p className="font-mono text-[0.75rem] text-t-surface/65">
                {order.contact.email}
              </p>
            )}
          </DetailSection>
        )}

        {/* Transactions */}
        {order.transactions.length > 0 && (
          <DetailSection label="transactions">
            <div className="space-y-2">
              {order.transactions.map((tx, i) => (
                <div
                  key={tx.id ?? i}
                  className="flex flex-wrap items-center gap-3"
                >
                  <span
                    className={`font-mono text-[0.6rem] lowercase px-2 py-0.5 border ${statusColor(tx.status)}`}
                  >
                    {tx.status.toLowerCase()}
                  </span>
                  <span className="font-mono text-[0.8rem] text-t-surface font-semibold">
                    {formatAmount(tx.amount, tx.currency)}
                  </span>
                  <span
                    className={`font-mono text-[0.7rem] ${isBtcMethod(tx.method) ? "text-t-accent" : "text-t-surface/55"}`}
                  >
                    {methodLabel(tx.method)}
                  </span>
                  <span className="font-mono text-[0.65rem] text-t-surface/40">
                    {formatDateTime(tx.date)}
                  </span>
                  {tx.externalRef && (
                    <span className="font-mono text-[0.6rem] text-t-surface/35 truncate max-w-[200px]">
                      ref: {tx.externalRef}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Invoice */}
        {order.invoice && (
          <DetailSection label="invoice">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[0.8rem] text-t-surface">
                  #{order.invoice.number}
                </span>
                {order.invoice.title && (
                  <span className="font-mono text-[0.75rem] text-t-surface/55">
                    {order.invoice.title}
                  </span>
                )}
                <span
                  className={`font-mono text-[0.6rem] lowercase px-2 py-0.5 border ${statusColor(order.invoice.status)}`}
                >
                  {order.invoice.status.toLowerCase()}
                </span>
              </div>
              {order.invoice.lineItems.length > 0 && (
                <div className="mt-2 space-y-1">
                  {order.invoice.lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 font-mono text-[0.72rem]"
                    >
                      <span className="text-t-surface/70">
                        {item.name}
                      </span>
                      <span className="text-t-surface/45">
                        × {item.quantity}
                      </span>
                      <span className="text-t-surface/65">
                        {formatAmount(item.unitPrice, order.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <a
                href={order.invoice.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block font-mono text-[0.68rem] text-t-accent hover:text-t-surface transition-colors"
              >
                view invoice →
              </a>
            </div>
          </DetailSection>
        )}

        {/* Order items */}
        {order.orderItems.length > 0 && (
          <DetailSection label="items">
            <div className="space-y-1">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <span className="font-mono text-[0.75rem] text-t-surface/70">
                    {item.label ??
                      item.paymentLinkItem?.title ??
                      "item"}
                  </span>
                  <span className="font-mono text-[0.7rem] text-t-surface/45">
                    × {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Event tickets */}
        {order.eventTickets.length > 0 && (
          <DetailSection label="tickets">
            <div className="space-y-1">
              {order.eventTickets.map((ticket) => (
                <p
                  key={ticket.id}
                  className="font-mono text-[0.75rem] text-t-surface/70"
                >
                  {ticket.paymentLinkItem.title ?? ticket.id}
                </p>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Tags */}
        {order.tags.length > 0 && (
          <DetailSection label="tags">
            <div className="flex flex-wrap gap-2">
              {order.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[0.6rem] px-2 py-0.5 border border-t-surface/20 text-t-surface/55"
                >
                  {tag}
                </span>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Links */}
        <DetailSection label="links">
          <div className="flex flex-wrap gap-4">
            <a
              href={order.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.68rem] text-t-accent hover:text-t-surface transition-colors"
            >
              checkout →
            </a>
            {order.receiptPdfUrl && (
              <a
                href={order.receiptPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[0.68rem] text-t-accent hover:text-t-surface transition-colors"
              >
                receipt pdf →
              </a>
            )}
          </div>
        </DetailSection>

        {/* Metadata */}
        {Object.keys(order.metadata).length > 0 && (
          <DetailSection label="metadata">
            <div className="space-y-1">
              {Object.entries(order.metadata).map(([k, v]) => (
                <p
                  key={k}
                  className="font-mono text-[0.7rem] text-t-surface/55"
                >
                  <span className="text-t-surface/40">{k}:</span> {v}
                </p>
              ))}
            </div>
          </DetailSection>
        )}

        {/* Order ID */}
        <div className="pt-2">
          <p className="font-mono text-[0.6rem] text-t-surface/30">
            id: {order.id}
            {order.externalUniqId && ` | ext: ${order.externalUniqId}`}
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-[0.55rem] text-t-surface/40 uppercase tracking-wider mb-1.5">
        {label}
      </p>
      {children}
    </div>
  );
}
