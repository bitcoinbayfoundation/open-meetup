import { requireAdmin } from "@/lib/require-admin";
import { getResourceById } from "@/lib/resources";
import { notFound } from "next/navigation";
import ResourceEditor from "../../editor";

export default async function EditResourcePage(ctx: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await ctx.params;
  const resource = await getResourceById(id);
  if (!resource) notFound();
  return <ResourceEditor resource={resource} />;
}
