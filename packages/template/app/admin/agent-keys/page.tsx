import { requireAdmin } from "@/lib/require-admin";
import AgentKeyList from "./agent-key-list";

export default async function AgentKeysPage() {
  await requireAdmin();
  return <AgentKeyList />;
}
