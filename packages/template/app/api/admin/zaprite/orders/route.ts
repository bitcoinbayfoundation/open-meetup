import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getOrders } from "@/lib/zaprite";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const page = url.searchParams.get("page");
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const includePending = url.searchParams.get("includePending");

    const data = await getOrders({
      page: page ? parseInt(page, 10) : undefined,
      status: status || undefined,
      search: search || undefined,
      includePending: includePending === "true",
    });

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
