import { Suspense } from "react";
import Link from "next/link";
import { genMetadata } from "@/lib/og";
import { DonationDetails } from "./donation-details";
import config from "@/site.config";

export const metadata = genMetadata({
  path: "/donate/thank-you",
  title: `Thank You — ${config.org.name}`,
  description:
    `Thank you for your generous donation to ${config.org.name}. Your support fuels Bitcoin education and community building in ${config.location.city}.`,
});

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-t-dark text-t-surface relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-t-accent/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-36 lg:pt-48 pb-24 lg:pb-36">
        {/* Terminal prompt */}
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-8">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/60">echo &quot;thank you&quot; &gt;&gt; /var/log/supporters.txt</span>
        </div>

        {/* Heading with checkmark */}
        <div className="flex items-center gap-5 mb-6">
          <div className="shrink-0 inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 border-2 border-t-accent/40 text-t-accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 sm:w-8 sm:h-8">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2.5rem,7vw,5rem)]">
            thank you<span className="text-t-accent glow">.</span>
          </h1>
        </div>

        <div className="border-l-2 border-t-accent pl-6 mb-12 max-w-[55ch]">
          <p className="font-sans text-[1.05rem] leading-[1.8] text-t-surface/75">
            Your generosity means the world to us. Every dollar and every sat
            goes directly toward building something that matters — a community
            grounded in sound money principles.
          </p>
        </div>

        {/* Donation details (client component, reads ?order= param) */}
        <Suspense>
          <DonationDetails />
        </Suspense>

        {/* Impact blocks */}
        <div className="space-y-1 mb-14">
          <div className="border border-t-surface/12 p-5 flex items-start gap-4">
            <span className="font-mono text-t-accent text-[0.7rem] mt-0.5 shrink-0">01</span>
            <div>
              <h3 className="font-mono font-semibold text-t-surface text-[0.85rem] lowercase mb-1">
                bitcoin education
              </h3>
              <p className="font-sans text-[0.85rem] text-t-surface/55 leading-relaxed">
                Free workshops, study groups, and educational resources that help
                people understand Bitcoin — from first principles to running
                their own node.
              </p>
            </div>
          </div>

          <div className="border border-t-surface/12 p-5 flex items-start gap-4">
            <span className="font-mono text-t-accent text-[0.7rem] mt-0.5 shrink-0">02</span>
            <div>
              <h3 className="font-mono font-semibold text-t-surface text-[0.85rem] lowercase mb-1">
                community events
              </h3>
              <p className="font-sans text-[0.85rem] text-t-surface/55 leading-relaxed">
                Regular meetups, special events, hackathons, and gatherings
                that bring together builders, educators, and curious minds
                across {config.location.city}.
              </p>
            </div>
          </div>

          <div className="border border-t-surface/12 p-5 flex items-start gap-4">
            <span className="font-mono text-t-accent text-[0.7rem] mt-0.5 shrink-0">03</span>
            <div>
              <h3 className="font-mono font-semibold text-t-surface text-[0.85rem] lowercase mb-1">
                keeping the mission alive
              </h3>
              <p className="font-sans text-[0.85rem] text-t-surface/55 leading-relaxed">
                Infrastructure, tools, and operations that keep {config.org.shortName}
                running — because the work of educating and advocating for
                sound money never stops.
              </p>
            </div>
          </div>
        </div>

        {/* Quote / message */}
        <div className="border border-t-accent/20 bg-t-accent/[0.03] p-6 mb-14">
          <p className="font-mono text-[0.7rem] text-t-accent/50 uppercase tracking-wider mb-3">
            from our team
          </p>
          <p className="font-sans text-[0.95rem] leading-[1.8] text-t-surface/65 italic">
            &ldquo;{config.org.shortName} exists because people like you believe that
            financial literacy and sovereignty matter. Your donation isn&apos;t
            just funding an organization — it&apos;s investing in a future where
            everyone has access to sound money education. We don&apos;t take
            that lightly.&rdquo;
          </p>
        </div>

        {/* Tax info */}
        <div className="border-l-2 border-t-surface/15 pl-5 mb-14">
          <p className="font-mono text-[0.7rem] text-t-surface/40 leading-relaxed">
            {config.org.name} is a registered {config.legal.nonprofitStatus} nonprofit.
            Your donation is tax-deductible to the extent allowed by law.
            A receipt will be sent to your email for your records.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.04em] bg-t-accent text-t-surface px-7 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
          >
            back to home
          </Link>
          <Link
            href="/events"
            className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.04em] border border-t-surface/20 text-t-surface/70 px-7 py-3 hover:border-t-accent hover:text-t-accent transition-all duration-200"
          >
            see upcoming events
          </Link>
        </div>
      </div>
    </main>
  );
}
