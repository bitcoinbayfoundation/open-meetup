import Link from "next/link";
import fs from "fs";
import path from "path";
import NewsletterForm from "./newsletter-form";
import { genMetadata } from "@/lib/og";
import config from "@/site.config";
import { faqs as allFaqs } from "@/lib/content";

export const metadata = genMetadata({
  path: "/about",
  title: `About ${config.org.name} — ${config.location.city}'s Bitcoin & Blockchain Nonprofit`,
  image: "/og/about.png",
  description:
    `Founded in ${config.org.foundedDate}, ${config.org.name} is a ${config.location.city}-based ${config.legal.nonprofitStatus} nonprofit building the Bitcoin community through monthly meetups, education workshops, and events across ${config.location.city}, ${config.location.state}.`,
});

const aboutPath = path.join(process.cwd(), "content/about.md");
const aboutContent = fs.existsSync(aboutPath) ? fs.readFileSync(aboutPath, "utf-8").trim() : "";
const paragraphs = aboutContent ? aboutContent.split("\n\n").filter(Boolean) : [];

const facts = [
  { label: "Founded", value: config.org.foundedDate },
  { label: "Status", value: `${config.legal.nonprofitStatus} Nonprofit` },
  { label: "Location", value: `${config.location.city}, ${config.location.state}` },
  { label: "Events per month", value: "5+" },
  { label: "Monthly attendees", value: "100+" },
  { label: "EIN", value: config.legal.ein },
];

const aboutFaqs = allFaqs.about;

const aboutFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: aboutFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: `About ${config.org.name}`,
  description:
    `${config.org.name} is a ${config.legal.nonprofitStatus} nonprofit based in ${config.location.city}, ${config.location.state}. Founded in ${config.org.foundedDate}, it is the largest Bitcoin community in the ${config.location.areaDescription}, hosting 5+ events per month with over 100 monthly attendees.`,
  mainEntity: {
    "@type": "Organization",
    name: config.org.name,
    url: config.url,
    foundingDate: config.org.foundedDate,
    areaServed: `${config.location.city}, ${config.location.state}`,
    numberOfEmployees: { "@type": "QuantitativeValue", value: "Volunteer-run" },
    knowsAbout: [
      "Bitcoin",
      "Cryptocurrency",
      "Blockchain Technology",
      "Lightning Network",
      "Sound Money",
      "Self-Custody",
      "Bitcoin Education",
    ],
  },
};

export default function AboutPage() {
  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      {aboutFaqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutFaqJsonLd) }}
        />
      )}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        {/* Terminal prompt */}
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6 flex items-center gap-2">
          <span className="text-t-accent">$</span>
          <span className="text-t-surface/70">cat /about/our-story.txt</span>
        </div>

        {/* Heading */}
        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(3rem,8vw,7rem)] mb-16">
          our story<span className="text-t-accent glow">.</span>
        </h1>

        {/* Body paragraphs */}
        <div className="max-w-[72ch] space-y-8">
          {paragraphs.length > 0 ? paragraphs.map((text, i) => (
            <div key={i} className="border-l-2 border-t-accent/40 pl-6">
              <p className="font-sans text-[clamp(0.95rem,1.2vw,1.1rem)] leading-[1.8] text-t-surface/70">
                {text}
              </p>
            </div>
          )) : (
            <div className="border border-t-accent/30 bg-t-accent/5 p-8">
              <p className="font-mono text-[0.85rem] text-t-accent mb-2">content needed</p>
              <p className="font-sans text-[0.95rem] text-t-surface/60 leading-relaxed">
                Add your story to <code className="font-mono text-t-accent bg-t-surface/5 px-1.5 py-0.5 text-[0.85rem]">content/about.md</code> to populate this page.
              </p>
            </div>
          )}
        </div>

        {/* Quick facts */}
        <div className="max-w-[72ch] mt-16 border border-t-surface/10 bg-t-surface/5 p-6 lg:p-8">
          <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-t-accent mb-6">
            quick facts
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-t-surface/40">
                  {f.label}
                </dt>
                <dd className="font-mono text-[0.85rem] text-t-surface font-semibold mt-1">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Newsletter */}
        <NewsletterForm />

        {/* FAQ */}
        {aboutFaqs.length > 0 && (
          <div className="mt-20 border-t border-t-surface/10 pt-12">
            <p className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
              <span className="text-t-accent">$</span> cat /about/faq.json
            </p>
            <h2 className="font-mono font-bold lowercase leading-[0.9] tracking-[-0.02em] text-t-surface text-[clamp(1.8rem,4vw,3rem)] mb-10">
              frequently asked<span className="text-t-accent">.</span>
            </h2>
            <div className="space-y-4 max-w-[72ch]">
              {aboutFaqs.map((faq) => (
                <details
                  key={faq.question}
                  className="border border-t-surface/10 bg-t-surface/5 group"
                >
                  <summary className="cursor-pointer p-5 font-mono text-[0.85rem] text-t-surface/80 hover:text-t-accent transition-colors list-none flex items-center justify-between">
                    <span>{faq.question}</span>
                    <span className="text-t-accent ml-4 group-open:rotate-45 transition-transform text-lg shrink-0">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-t-surface/60 text-[0.85rem] leading-[1.8] border-t border-t-surface/10 pt-4">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-20 border-t border-t-surface/10 pt-12">
          <p className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
            <span className="text-t-accent">$</span> ./support-the-mission.sh
          </p>
          <h2 className="font-mono font-bold lowercase leading-[0.9] tracking-[-0.02em] text-t-surface text-[clamp(1.8rem,4vw,3rem)] mb-6">
            help us <span className="text-t-accent">build.</span>
          </h2>
          <p className="font-sans text-[clamp(0.92rem,1.1vw,1.05rem)] leading-[1.7] text-t-surface/60 max-w-[44ch] mb-8">
            Every donation fuels education, community events, and sound money
            advocacy across {config.location.city}.
          </p>
          <Link
            href="/donate"
            className="inline-block font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
          >
            &rarr; donate now
          </Link>
        </div>
      </div>
    </main>
  );
}