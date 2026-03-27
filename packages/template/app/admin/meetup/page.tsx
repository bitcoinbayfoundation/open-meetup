import { requireAdmin } from "@/lib/require-admin";
import MeetupDebug from "./meetup-debug";

export default async function MeetupAdminPage() {
  await requireAdmin();
  return <MeetupDebug />;
}
