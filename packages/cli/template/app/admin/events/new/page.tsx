import { requireAdmin } from "@/lib/require-admin";
import EventEditor from "../editor";

export default async function NewEventPage() {
  await requireAdmin();
  return <EventEditor />;
}
