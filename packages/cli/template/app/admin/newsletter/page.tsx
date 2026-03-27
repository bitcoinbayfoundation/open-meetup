import { requireAdmin } from "@/lib/require-admin";
import NewsletterAdmin from "./newsletter-admin";

export default async function AdminNewsletterPage() {
  await requireAdmin();
  return <NewsletterAdmin />;
}
