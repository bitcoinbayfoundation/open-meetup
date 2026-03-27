import { requireAdmin } from "@/lib/require-admin";
import MeetupAuthClient from "./meetup-auth-client";

export default async function MeetupAuthPage() {
  await requireAdmin();

  const clientId = process.env.MEETUP_CLIENT_ID ?? "";
  const hasClientId = !!clientId;
  const hasClientSecret = !!process.env.MEETUP_CLIENT_SECRET;

  return (
    <MeetupAuthClient
      clientId={clientId}
      hasClientId={hasClientId}
      hasClientSecret={hasClientSecret}
    />
  );
}
