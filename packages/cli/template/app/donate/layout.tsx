import { genMetadata } from "@/lib/og";
import config from "@/site.config";

export const metadata = genMetadata({
  path: "/donate",
  title: `Donate to ${config.org.name} — Support Bitcoin Education in ${config.location.city}`,
  image: "/og/donate.jpg",
  description:
    `Support Bitcoin education and community building in ${config.location.city}, ${config.location.stateAbbrev}. ${config.org.name} is a ${config.legal.nonprofitStatus} nonprofit — your tax-deductible donation funds meetups, workshops, and events.`,
});

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: `Is my donation to ${config.org.name} tax deductible?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Yes! ${config.org.name} is a registered ${config.legal.nonprofitStatus} nonprofit. All donations are tax-deductible to the extent allowed by law.`,
      },
    },
    {
      "@type": "Question",
      name: `Does ${config.org.name} accept Bitcoin donations?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely! We accept Bitcoin donations via our payment page.",
      },
    },
    {
      "@type": "Question",
      name: `How do I donate to ${config.org.name} by check?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Please mail checks to ${config.org.name}. Contact us for mailing details.`,
      },
    },
    {
      "@type": "Question",
      name: `Does ${config.org.name} accept employee matching gifts?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `Yes! ${config.org.name} helps donors get their employer to match donations. Many employers match charitable contributions through programs like Benevity and YourCause. Visit our employer matching page to search for your company and learn how to double your impact.`,
      },
    },
  ],
};

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
