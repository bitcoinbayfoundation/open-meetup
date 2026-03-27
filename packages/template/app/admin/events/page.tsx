import { requireAdmin } from "@/lib/require-admin";
import { getAllEventsAdmin } from "@/lib/events";
import AdminEventList from "./event-list";

export default async function AdminEventsPage() {
  await requireAdmin();
  const events = await getAllEventsAdmin();
  return <AdminEventList events={events} />;
}
