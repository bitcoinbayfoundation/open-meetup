import { requireAdmin } from "@/lib/require-admin";
import { pool } from "@/lib/db";
import PostEditor from "../editor";

export default async function NewPostPage() {
  const session = await requireAdmin();
  const { rows: users } = await pool.query(
    `SELECT id, name FROM "user" ORDER BY name ASC`,
  );
  return (
    <PostEditor
      users={users}
      currentUserId={session.user.id}
    />
  );
}
