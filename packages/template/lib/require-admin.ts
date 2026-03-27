import { auth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { pool } from "./db";

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/admin/login");

  // Check if user has 2FA enabled
  const { rows } = await pool.query(
    `SELECT "twoFactorEnabled" FROM "user" WHERE id = $1`,
    [session.user.id],
  );

  const user = rows[0];
  if (!user?.twoFactorEnabled) {
    redirect("/admin/setup-2fa");
  }

  return session;
}
