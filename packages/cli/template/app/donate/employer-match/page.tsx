import Link from "next/link";
import { genMetadata } from "@/lib/og";
import config from "@/site.config";
import EmployerMatchSearch from "./employer-match-search";

export const metadata = genMetadata({
  path: "/donate/employer-match",
  title: `Employer Matching | ${config.org.name}`,
  description:
    `Double your donation to ${config.org.name} through your employer's matching gift program. Search our database of companies that match charitable donations.`,
});

const steps = [
  {
    number: "01",
    title: "Make your donation",
    description:
      `Donate to ${config.org.name} through any of our giving channels.`,
  },
  {
    number: "02",
    title: "Request a donation receipt",
    description:
      "We will provide an official 501(c)(3) donation receipt for your records.",
  },
  {
    number: "03",
    title: "Submit to your employer",
    description:
      "Use your company's matching gift portal or contact HR to submit your match request.",
  },
  {
    number: "04",
    title: "Employer sends matching donation",
    description:
      `Your employer verifies and sends a matching donation to ${config.org.name}.`,
  },
];

const matchingPlatforms = [
  { name: "Benevity", url: "https://benevity.com" },
  { name: "YourCause", url: "https://yourcause.com" },
  { name: "CyberGrants", url: "https://cybergrants.com" },
  { name: "Double the Donation", url: "https://doublethedonation.com" },
];

export default function EmployerMatchPage() {
  return (
    <main className="min-h-screen bg-t-dark text-t-surface">
      {/* Hero */}
      <section className="px-6 pt-24 pb-16 max-w-5xl mx-auto">
        <p className="font-mono text-t-accent text-sm mb-6">
          $ grep --employer matching-programs.db
        </p>
        <h1 className="font-mono text-3xl md:text-5xl font-bold tracking-tight mb-4">
          double your impact
        </h1>
        <p className="text-t-surface/80 text-lg max-w-2xl">
          Many employers match charitable donations made by their employees.
          {config.org.name} helps you get your donation matched, effectively
          doubling your contribution to Bitcoin education in {config.location.city}.
        </p>
      </section>

      {/* Company Search — client component */}
      <EmployerMatchSearch />

      {/* Process Steps */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <h2 className="font-mono text-xl md:text-2xl font-semibold text-t-accent mb-8">
          how_it_works
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-t-dark-alt border border-t-accent/20 p-6"
            >
              <span className="font-mono text-3xl font-bold text-t-accent/30 block mb-3">
                {step.number}
              </span>
              <h3 className="font-mono text-lg font-semibold text-t-surface mb-2">
                {step.title}
              </h3>
              <p className="text-t-surface/80 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Matching Platforms */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <h2 className="font-mono text-xl md:text-2xl font-semibold text-t-accent mb-6">
          check_your_employer
        </h2>
        <div className="bg-t-dark-alt border border-t-accent/20 p-6 md:p-8">
          <p className="text-t-surface/90 leading-relaxed mb-4">
            Many companies use third-party platforms to manage their matching
            gift programs. Check these common platforms to see if your employer
            participates:
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {matchingPlatforms.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-t-surface/10 p-4 font-mono text-sm text-t-surface hover:border-t-accent/30 hover:text-t-accent transition-colors"
              >
                {platform.name}
                <span className="text-t-surface/40 ml-2">&rarr;</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Don't see your employer */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <h2 className="font-mono text-xl md:text-2xl font-semibold text-t-accent mb-6">
          dont_see_your_employer
        </h2>
        <div className="border-l-4 border-t-accent bg-t-dark-alt p-6 md:p-8">
          <p className="text-t-surface/90 leading-relaxed mb-4">
            Our database only includes a sample of companies that offer matching
            programs. Many more employers match charitable donations — contact
            your HR department to find out if your company participates.
          </p>
          <p className="text-t-surface/90 leading-relaxed mb-6">
            If your employer matches donations and you need our EIN or any
            documentation, reach out and we will provide everything you need.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-t-accent text-t-surface font-mono text-[0.75rem] font-semibold lowercase tracking-[0.06em] px-8 py-3.5 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
          >
            contact us
          </Link>
        </div>
      </section>

      {/* Back Link */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <Link
          href="/donate"
          className="inline-block border border-t-surface/30 text-t-surface/70 font-mono text-[0.75rem] lowercase tracking-[0.06em] px-8 py-3.5 bg-transparent hover:border-t-accent hover:text-t-accent transition-all duration-200"
        >
          &larr; back to donate
        </Link>
      </section>
    </main>
  );
}
