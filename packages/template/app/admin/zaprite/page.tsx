import { requireAdmin } from "@/lib/require-admin";
import ZapriteAdmin from "./zaprite-admin";

export default async function ZapriteAdminPage() {
  await requireAdmin();
  return <ZapriteAdmin />;
}
