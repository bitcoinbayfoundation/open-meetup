import { auth } from "./auth";
import { pool } from "./db";
import { NextResponse } from "next/server";

type VerifyResult =
  | { ok: true; userId: string; attributedUserId: string | null }
  | { ok: false; response: NextResponse };

export async function requireApiKey(request: Request): Promise<VerifyResult> {
  const header = request.headers.get("authorization");
  console.log("[api-key] Authorization header present:", !!header);
  console.log("[api-key] Header starts with 'Bearer ':", header?.startsWith("Bearer ") ?? false);
  if (!header?.startsWith("Bearer ")) {
    console.log("[api-key] REJECTED: missing or malformed Authorization header");
    console.log("[api-key] Raw header value prefix:", header?.slice(0, 20) ?? "(null)");
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 },
      ),
    };
  }

  const key = header.slice(7);
  console.log("[api-key] Key length:", key.length);
  console.log("[api-key] Key prefix:", key.slice(0, 8) + "...");
  console.log("[api-key] Key has whitespace/newlines:", /\s/.test(key));

  let result: Awaited<ReturnType<typeof auth.api.verifyApiKey>>;
  try {
    result = await auth.api.verifyApiKey({ body: { key } });
    console.log("[api-key] verifyApiKey result:", JSON.stringify({
      valid: result.valid,
      error: result.error,
      keyId: result.key?.id,
      keyName: result.key?.name,
      keyEnabled: result.key?.enabled,
      keyExpiresAt: result.key?.expiresAt,
      keyReferenceId: result.key?.referenceId,
    }));
  } catch (err) {
    console.error("[api-key] verifyApiKey threw:", err);
    return {
      ok: false,
      response: NextResponse.json(
        { error: "API key verification failed" },
        { status: 401 },
      ),
    };
  }

  if (!result.valid || !result.key) {
    console.log("[api-key] REJECTED: key not valid. Error:", result.error);
    return {
      ok: false,
      response: NextResponse.json(
        { error: result.error?.message || "Invalid API key" },
        { status: 401 },
      ),
    };
  }

  const userId = result.key.referenceId!;

  // Check if this key has an attributed user
  const { rows } = await pool.query(
    `SELECT user_id FROM api_key_users WHERE api_key_id = $1`,
    [result.key.id],
  );

  const attributedUserId = rows.length > 0 ? rows[0].user_id : null;

  return { ok: true, userId, attributedUserId };
}
