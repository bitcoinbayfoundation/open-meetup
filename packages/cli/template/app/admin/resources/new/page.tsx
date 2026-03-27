import { requireAdmin } from "@/lib/require-admin";
import ResourceEditor from "../editor";

export default async function NewResourcePage() {
  await requireAdmin();
  return <ResourceEditor />;
}
