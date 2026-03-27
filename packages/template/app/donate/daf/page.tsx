import Link from "next/link";
import { genMetadata } from "@/lib/og";
import config from "@/site.config";

export const metadata = genMetadata({
  path: "/donate/daf",
  title: `Donor-Advised Funds via Unchained | ${config.org.name}`,
  description:
    `Give Bitcoin tax-free through Unchained's donor-advised fund program. Maximize your charitable impact with Bitcoin-native DAF giving to ${config.org.name}.`,
});

const benefits = [
  {
    title: "Simplify Bitcoin giving",
    description:
      "Unchained's DAF streamlines the process of donating Bitcoin, handling conversions, record-keeping, and distribution so you can focus on the causes you care about.",
  },
  {
    title: "Security and transparency",
    description:
      "Unchained leverages Bitcoin-native infrastructure for transparent, verifiable transactions. Every donation is traceable and secure, giving you confidence in your charitable giving.",
  },
  {
    title: "Significant tax benefits",
    description:
      "Contributing appreciated Bitcoin to a DAF allows you to take an immediate tax deduction at the full market value while avoiding capital gains taxes on the appreciation.",
  },
  {
    title: "Support the Bitcoin ecosystem",
    description:
      "By using Unchained's Bitcoin-native DAF, you strengthen the broader Bitcoin ecosystem and demonstrate the viability of Bitcoin as a tool for philanthropy and social good.",
  },
];

export default function DafPage() {
  return (
    <main className="min-h-screen bg-t-dark text-t-surface">
      {/* Hero */}
      <section className="px-6 pt-24 pb-16 max-w-5xl mx-auto">
        <p className="font-mono text-t-accent text-sm mb-6">
          $ cat /donate/daf-info.txt
        </p>
        <h1 className="font-mono text-3xl md:text-5xl font-bold tracking-tight mb-4">
          donor-advised funds
        </h1>
        <p className="text-t-surface/80 text-lg max-w-2xl">
          Maximize your impact with Bitcoin-native charitable giving through
          Unchained
        </p>
      </section>

      {/* What is a DAF */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <h2 className="font-mono text-xl md:text-2xl font-semibold text-t-accent mb-6">
          what_is_a_donor_advised_fund
        </h2>
        <div className="bg-t-dark-alt border border-t-accent/20 p-6 md:p-8">
          <p className="text-t-surface/90 leading-relaxed mb-4">
            A donor-advised fund (DAF) is a charitable giving vehicle that
            allows you to make an irrevocable contribution, receive an immediate
            tax deduction, and then recommend grants to your favorite nonprofits
            over time.
          </p>
          <p className="text-t-surface/90 leading-relaxed">
            With Bitcoin-native DAFs, you can contribute Bitcoin directly,
            avoiding capital gains taxes on appreciated assets while maximizing
            the value of your donation. The fund sponsor handles the
            administrative burden, including tax receipts, record-keeping, and
            grant distribution.
          </p>
        </div>
      </section>

      {/* Unchained CTA */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <h2 className="font-mono text-xl md:text-2xl font-semibold text-t-accent mb-6">
          give_through_unchained
        </h2>
        <div className="border-l-4 border-t-accent bg-t-dark-alt p-6 md:p-8">
          <p className="text-t-surface/90 leading-relaxed mb-4">
            {config.org.name} has partnered with Unchained to make
            Bitcoin-native DAF giving simple and secure. Unchained&apos;s
            donor-advised fund program lets you donate appreciated Bitcoin,
            receive an immediate tax deduction, and direct grants to{" "}
            {config.org.name} and other nonprofits you support.
          </p>
          <a
            href={`https://www.unchained.com/donor-advised-funds?utm_source=${config.contact.domain}&utm_medium=web`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-t-accent text-t-surface font-mono text-[0.75rem] font-semibold lowercase tracking-[0.06em] px-8 py-3.5 hover:bg-t-surface hover:text-t-dark transition-all duration-200 mt-2"
          >
            open unchained daf program
          </a>
          <p className="font-mono text-[0.65rem] text-t-surface/50 mt-4 flex items-center gap-2">
            <span className="text-t-accent">$</span>
            <span>
              open https://unchained.com/donor-advised-funds &rarr;
            </span>
          </p>
        </div>
      </section>

      {/* Why Unchained */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <h2 className="font-mono text-xl md:text-2xl font-semibold text-t-accent mb-6">
          why_unchained
        </h2>
        <div className="bg-t-dark-alt border border-t-accent/20 p-6 md:p-8">
          <p className="text-t-surface/90 leading-relaxed mb-4">
            Unchained is a Bitcoin-native financial services company that
            specializes in multi-signature custody, lending, and charitable
            giving. Their DAF program is purpose-built for Bitcoiners who want
            to give back without leaving the Bitcoin ecosystem.
          </p>
          <p className="text-t-surface/90 leading-relaxed">
            As a trusted partner, Unchained provides the infrastructure for
            secure, tax-efficient Bitcoin donations while {config.org.name}{" "}
            focuses on education and community building in {config.location.city}. Together,
            we make it easy to support Bitcoin education with sound money.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <h2 className="font-mono text-xl md:text-2xl font-semibold text-t-accent mb-8">
          benefits_of_unchained_daf
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="border-l-4 border-t-accent bg-t-dark-alt p-6"
            >
              <h3 className="font-mono text-lg font-semibold text-t-surface mb-3">
                {benefit.title}
              </h3>
              <p className="text-t-surface/80 text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <blockquote className="border-l-4 border-t-accent bg-t-dark-alt p-6 md:p-8">
          <p className="font-mono text-t-surface/90 text-lg md:text-xl leading-relaxed italic">
            &ldquo;Bitcoin donor-advised funds are more than just a way to
            give&mdash;they&apos;re a way to transform how we think about money,
            security, and philanthropy.&rdquo;
          </p>
        </blockquote>
      </section>

      {/* CTA */}
      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={`https://www.unchained.com/donor-advised-funds?utm_source=${config.contact.domain}&utm_medium=web`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-t-accent text-t-surface font-mono text-[0.75rem] font-semibold lowercase tracking-[0.06em] px-8 py-3.5 hover:bg-t-surface hover:text-t-dark transition-all duration-200 text-center"
          >
            start giving through unchained
          </a>
          <Link
            href="/donate"
            className="inline-block border border-t-surface/30 text-t-surface/70 font-mono text-[0.75rem] lowercase tracking-[0.06em] px-8 py-3.5 bg-transparent hover:border-t-accent hover:text-t-accent transition-all duration-200 text-center"
          >
            &larr; back to donate
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="border border-t-accent/20 bg-t-dark-alt/50 p-6">
          <p className="font-mono text-xs text-t-surface/70 leading-relaxed">
            {config.org.name} does not operate a donor-advised fund
            directly. DAF services are provided by Unchained. {config.org.name}{" "}
            does not provide tax or legal advice. Please consult with
            a tax advisor.
          </p>
        </div>
      </section>
    </main>
  );
}
