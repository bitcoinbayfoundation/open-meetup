import { genMetadata } from "@/lib/og";
import config from "@/site.config";

export const metadata = genMetadata({
  path: "/contact",
  title: `Contact ${config.org.name} — ${config.location.city}'s Bitcoin Community`,
  image: "/og/contact.jpg",
  description:
    `Get in touch with ${config.org.name}. Questions about Bitcoin meetups, workshops, or community events in ${config.location.city}, ${config.location.state}? Reach out — we'd love to hear from you.`,
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
