import { requireAdmin } from "@/lib/require-admin";
import UserList from "./user-list";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  return <UserList currentUserId={session.user.id} />;
}
