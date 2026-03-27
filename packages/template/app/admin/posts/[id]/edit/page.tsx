import { requireAdmin } from "@/lib/require-admin";
import { getPostById } from "@/lib/posts";
import { pool } from "@/lib/db";
import { notFound } from "next/navigation";
import PostEditor from "../../editor";

export default async function EditPostPage(
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();

  const { id } = await ctx.params;
  const [post, { rows: users }] = await Promise.all([
    getPostById(id),
    pool.query(`SELECT id, name FROM "user" ORDER BY name ASC`),
  ]);
  if (!post) notFound();

  return (
    <PostEditor
      post={post}
      users={users}
      currentUserId={session.user.id}
    />
  );
}
