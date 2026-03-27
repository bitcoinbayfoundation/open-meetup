import { requireAdmin } from "@/lib/require-admin";
import AdminDashboard from "./dashboard";

export default async function AdminPage() {
  const session = await requireAdmin();
  return <AdminDashboard user={session.user} />;
}
