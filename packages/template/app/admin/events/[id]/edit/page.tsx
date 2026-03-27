import { requireAdmin } from "@/lib/require-admin";
import { getEventById } from "@/lib/events";
import { notFound } from "next/navigation";
import EventEditor from "../../editor";

export default async function EditEventPage(ctx: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await ctx.params;
  const event = await getEventById(id);
  if (!event) notFound();
  return <EventEditor event={event} />;
}
