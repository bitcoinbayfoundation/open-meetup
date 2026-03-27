import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { optimizeImage } from "@/lib/optimize-image";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const { buffer, filename, mimeType } = await optimizeImage(file);

  const blob = await put(`posts/${Date.now()}-${filename}`, buffer, {
    access: "public",
    contentType: mimeType,
  });

  return NextResponse.json({ url: blob.url });
}
