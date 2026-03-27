import { requireAdmin } from "@/lib/require-admin";
import { getAllPostsAdmin } from "@/lib/posts";
import AdminPostList from "./post-list";

export default async function AdminPostsPage() {
  await requireAdmin();
  const posts = await getAllPostsAdmin();
  return <AdminPostList posts={posts} />;
}
