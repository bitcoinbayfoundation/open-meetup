import { requireAdmin } from "@/lib/require-admin";
import { getAllResourcesAdmin } from "@/lib/resources";
import AdminResourceList from "./resource-list";

export default async function AdminResourcesPage() {
  await requireAdmin();
  const resources = await getAllResourcesAdmin();
  return <AdminResourceList resources={resources} />;
}
