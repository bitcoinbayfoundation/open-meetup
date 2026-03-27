import Image from "next/image";
import config from "@/site.config";
import { faqs as allFaqs } from "@/lib/content";
import { Reveal, TypeWriter, MouseGlow } from "./home-client";
import BTCMapStats from "./btcmap-stats";

const homeFaqs = allFaqs.home;

const homeFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homeFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const supporters: Array<{name: string; src: string; href: string}> = [];

export default function Home() {
  return (
    <>
      {homeFaqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqJsonLd) }}
        />
      )}
      {/* ━━━ HERO ━━━ */}
      <section className="relative min-h-screen flex flex-col justify-end overflow-hidden bg-t-dark scanlines">
        <MouseGlow />
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 lg:px-12 pb-12 lg:pb-20 pointer-events-auto">
          <Reveal>
            <div className="font-mono text-[0.65rem] text-t-surface/50 mb-4 flex items-center gap-2">
              <span className="text-t-accent">$</span>
              <TypeWriter text={`cat /${config.org.shortName.toLowerCase().replace(/\s+/g, "-")}/mission.txt`} delay={500} className="text-t-surface/70" />
            </div>
          </Reveal>

          {/* No Reveal wrapper — H1 must paint immediately for LCP */}
          <div className="fade-up">
            <h1 className="font-mono font-bold lowercase leading-[0.85] tracking-[-0.03em] text-t-surface text-[clamp(4rem,12vw,11rem)]">
              {config.org.shortName.split(/\s+/).map((word, i, arr) => (
                <span key={word}>
                  {i > 0 && <br />}
                  {word}
                  {i === arr.length - 1 && <span className="text-t-accent glow">.</span>}
                </span>
              ))}
            </h1>
          </div>

          <Reveal delay={500}>
            <div className="mt-8 border-l-2 border-t-accent pl-5 max-w-[44ch]">
              <p className="font-sans text-[clamp(0.95rem,1.3vw,1.15rem)] leading-[1.7] text-t-surface/70">
                {config.org.tagline + " " + config.org.mission}
              </p>
            </div>
          </Reveal>

          <Reveal delay={700}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="/events"
                className="group font-mono text-[0.75rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-8 py-3.5 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
              >
                → upcoming events
              </a>
              <a
                href="/about"
                className="font-mono text-[0.75rem] lowercase tracking-[0.06em] text-t-surface/70 border border-t-surface/30 px-8 py-3.5 hover:border-t-accent hover:text-t-accent transition-all duration-200"
              >
                our story
              </a>
              <span className="hidden lg:inline font-mono text-[0.6rem] text-t-surface/50 ml-4">
                est. {config.org.foundedDate.split("-")[0]} · {config.legal.nonprofitStatus} · {config.location.locality}, {config.location.stateAbbrev}
              </span>
            </div>
          </Reveal>
        </div>
      </section>



      {/* ━━━ WHAT WE DO ━━━ */}
      <section className="bg-t-surface text-t-dark overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-24 lg:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 lg:sticky lg:top-[100px] lg:self-start">
              <Reveal>
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-t-accent bg-t-accent/10 px-3 py-1 inline-block mb-6">
                  what we do
                </span>
                <h2 className="font-mono font-bold lowercase leading-[0.92] tracking-[-0.02em] text-t-dark text-[clamp(2rem,4vw,3.2rem)]">
                  growing{" "}
                  <span className="text-t-accent">bitcoin</span>
                  <br />
                  from the ground up.
                </h2>
                <p className="mt-6 font-sans text-[0.95rem] leading-[1.7] text-t-dark/60 max-w-[32ch]">
                  We&apos;re not waiting for permission. We&apos;re building the
                  infrastructure for sound money adoption — one meetup, one
                  workshop, one community event at a time.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-7 lg:col-start-6 space-y-6">
              {config.programs.map((program, i) => (
                <Reveal key={program.name} delay={i * 150}>
                  <div className="bg-t-white border-l-4 border-l-t-accent p-8 lg:p-10 hover:translate-x-2 transition-transform duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <span className="font-mono text-[0.6rem] text-t-dark/25 tracking-[0.15em]">{String(i + 1).padStart(3, "0")}</span>
                      <span className="font-mono text-[0.6rem] text-t-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                    </div>
                    <h3 className="font-mono font-bold lowercase text-[1.3rem] tracking-[-0.01em] text-t-dark leading-tight">
                      {program.name}
                    </h3>
                    <p className="mt-3 font-sans text-[0.9rem] leading-[1.75] text-t-dark/60">
                      {program.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ MISSION ━━━ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
        <div className="bg-t-accent text-t-dark p-10 lg:p-16 xl:p-24 flex flex-col justify-center grain">
          <Reveal>
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-t-dark/50 mb-6 block">
              the mission
            </span>
            <h2 className="font-mono font-bold lowercase leading-[0.9] tracking-[-0.03em] text-t-dark text-[clamp(2.2rem,4.5vw,4rem)]">
              bitcoin is for
              <br />
              everyone.
            </h2>
            <p className="mt-6 font-sans text-[clamp(0.95rem,1.2vw,1.1rem)] leading-[1.7] text-t-dark/70 max-w-[38ch]">
              A {config.legal.nonprofitStatus} nonprofit making Bitcoin accessible in {config.location.city} — not
              just for the technically inclined. Sound money is a human right.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/about"
                className="font-mono text-[0.72rem] font-semibold lowercase tracking-[0.04em] bg-t-dark text-t-surface px-7 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
              >
                our story
              </a>
              <a
                href="/donate"
                className="font-mono text-[0.72rem] lowercase tracking-[0.04em] text-t-dark border-2 border-t-dark/40 px-7 py-3 hover:border-t-dark hover:bg-t-dark hover:text-t-surface transition-all duration-200"
              >
                support us
              </a>
            </div>
          </Reveal>
        </div>

        <div className="bg-t-dark text-t-surface p-10 lg:p-16 xl:p-24 flex flex-col justify-center grain scanlines">
          <Reveal delay={200}>
            <div className="font-mono text-[0.6rem] text-t-surface/50 mb-8">
              <span className="text-t-accent">$</span> cat /bitcoin/fundamentals.dat
            </div>
            <div className="space-y-8">
              {[
                { key: "SUPPLY", val: "21,000,000", note: "fixed. forever." },
                { key: "UPTIME", val: "99.98%", note: "15+ years running." },
                { key: "NETWORK", val: "24/7/365", note: "never closes." },
                { key: "TRUST", val: "VERIFY", note: "don't trust. verify." },
              ].map((row) => (
                <div key={row.key} className="border-b border-t-surface/8 pb-6">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-t-accent">{row.key}</span>
                    <span className="font-mono text-[clamp(1.8rem,3vw,2.8rem)] font-bold text-t-surface leading-none tracking-tight">{row.val}</span>
                  </div>
                  <span className="font-mono text-[0.65rem] text-t-surface/60 mt-1 block text-right">{row.note}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ━━━ SUPPORTERS ━━━ */}
      {supporters.length > 0 && (
        <section className="bg-t-surface py-16">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row lg:items-center gap-8">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-t-dark/60 shrink-0">
                backed by
              </span>
              <div className="flex flex-wrap items-center gap-10 lg:gap-14">
                {supporters.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-70 hover:opacity-100 transition-opacity duration-300"
                  >
                    <Image
                      src={s.src}
                      alt={s.name}
                      width={120}
                      height={48}
                      className="max-h-[36px] w-auto object-contain"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ━━━ ABOUT — crawlable context ━━━ */}
      <section className="bg-t-dark grain">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-24 lg:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: sticky header */}
            <div className="lg:col-span-4 lg:sticky lg:top-[100px] lg:self-start">
              <Reveal>
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-t-accent bg-t-accent/10 px-3 py-1 inline-block mb-6">
                  the foundation
                </span>
                <h2 className="font-mono font-bold lowercase leading-[0.92] tracking-[-0.02em] text-t-surface text-[clamp(2rem,4vw,3.2rem)]">
                  {config.location.city}&apos;s{" "}
                  <span className="text-t-accent">bitcoin</span>
                  <br />
                  community.
                </h2>
                <p className="mt-6 font-sans text-[0.95rem] leading-[1.7] text-t-surface/60 max-w-[32ch]">
                  {config.org.name} is a {config.legal.nonprofitStatus} nonprofit in {config.location.city},{" "}
                  {config.location.state}. {config.org.description}
                </p>
              </Reveal>
            </div>

            {/* Right: stacked cards */}
            <div className="lg:col-span-7 lg:col-start-6 space-y-6">
              {config.programs.map((program, i) => (
                <Reveal key={program.name} delay={i * 100}>
                  <div className="border-l-4 border-l-t-accent bg-t-surface/5 p-8 lg:p-10 hover:bg-t-surface/8 transition-colors duration-300 group">
                    <div className="flex items-start justify-between mb-4">
                      <span className="font-mono text-[0.6rem] text-t-surface/25 tracking-[0.15em]">{String(i + 1).padStart(3, "0")}</span>
                      <span className="font-mono text-[0.6rem] text-t-accent opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                    </div>
                    <h3 className="font-mono font-bold lowercase text-[1.3rem] tracking-[-0.01em] text-t-surface leading-tight">
                      {program.name}
                    </h3>
                    <p className="mt-3 font-sans text-[0.9rem] leading-[1.75] text-t-surface/60">
                      {program.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FAQ ━━━ */}
      {homeFaqs.length > 0 && (
        <section className="bg-t-surface text-t-dark overflow-hidden">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-24 lg:py-36">
            <Reveal>
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-t-accent bg-t-accent/10 px-3 py-1 inline-block mb-6">
                frequently asked
              </span>
              <h2 className="font-mono font-bold lowercase leading-[0.92] tracking-[-0.02em] text-t-dark text-[clamp(2rem,4vw,3.2rem)] mb-12">
                questions<span className="text-t-accent">.</span>
              </h2>
            </Reveal>
            <div className="space-y-4 max-w-[72ch]">
              {homeFaqs.map((faq, i) => (
                <Reveal key={faq.question} delay={i * 80}>
                  <details className="border-l-4 border-l-t-accent bg-t-white p-6 group">
                    <summary className="cursor-pointer font-mono text-[0.85rem] text-t-dark font-semibold list-none flex items-center justify-between">
                      <span>{faq.question}</span>
                      <span className="text-t-accent ml-4 group-open:rotate-45 transition-transform text-lg shrink-0">
                        +
                      </span>
                    </summary>
                    <p className="mt-4 font-sans text-[0.9rem] leading-[1.75] text-t-dark/70 border-t border-t-dark/10 pt-4">
                      {faq.answer}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━ SHOP WITH BITCOIN ━━━ */}
      <section className="bg-t-surface text-t-dark overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-24 lg:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <Reveal>
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-t-accent bg-t-accent/10 px-3 py-1 inline-block mb-6">
                  bitcoin map
                </span>
                <h2 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-dark text-[clamp(2.2rem,5.5vw,5rem)]">
                  shop with
                  <br />
                  <span className="text-t-accent">bitcoin.</span>
                </h2>
                <p className="mt-6 font-sans text-[clamp(0.95rem,1.2vw,1.1rem)] leading-[1.7] text-t-dark/60 max-w-[38ch]">
                  Businesses accept Bitcoin in the {config.location.areaDescription} —
                  restaurants, retailers, services, and more. The circular economy
                  is already here.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="/map"
                    className="font-mono text-[0.75rem] font-semibold lowercase tracking-[0.04em] bg-t-dark text-t-surface px-8 py-3.5 hover:bg-t-accent transition-all duration-200"
                  >
                    → explore the map
                  </a>
                </div>
              </Reveal>
            </div>
            <Reveal delay={200}>
              <BTCMapStats
                lat={config.location.mapCenter?.lat ?? 39.8283}
                lng={config.location.mapCenter?.lng ?? -98.5795}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ━━━ GALLERY ━━━ */}
      <section className="bg-t-dark grain overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 py-24 lg:py-40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-12">
            <div className="lg:col-span-7">
              <Reveal>
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.3em] text-t-accent bg-t-accent/10 px-3 py-1">
                    photo gallery
                  </span>
                </div>
                <h2 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2.2rem,5.5vw,5rem)]">
                  community
                  <br />
                  <span className="text-t-accent">in action.</span>
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-5">
              <Reveal delay={200}>
                <p className="font-sans text-[clamp(0.92rem,1.2vw,1.05rem)] leading-[1.7] text-t-surface/60 max-w-[40ch]">
                  Meetups, workshops, and community events — see what happens when
                  bitcoiners get together.
                </p>
              </Reveal>
            </div>
          </div>
          <Reveal delay={300}>
            <a
              href="/photos"
              className="group flex items-center justify-between border border-t-surface/20 p-6 lg:p-8 hover:border-t-accent/40 transition-all duration-300"
            >
              <div>
                <p className="font-mono text-[0.6rem] text-t-surface/50 mb-2">
                  <span className="text-t-accent">$</span> ls /gallery --all
                </p>
                <p className="font-mono text-[clamp(1rem,2vw,1.4rem)] font-bold lowercase text-t-surface group-hover:text-t-accent transition-colors">
                  browse the full gallery →
                </p>
              </div>
              <span className="hidden lg:block font-mono text-[0.7rem] text-t-surface/40 group-hover:text-t-accent transition-colors">
                meetups · workshops · community
              </span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="bg-t-dark grain scanlines">
        <div className="mx-auto max-w-[1000px] px-6 lg:px-12 py-32 lg:py-48 text-center">
          <Reveal>
            <div className="font-mono text-[0.6rem] text-t-surface/50 mb-8">
              <span className="text-t-accent">$</span> ./join-the-movement.sh
            </div>
            <h2 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(3rem,8vw,7rem)]">
              join the
              <br />
              <span className="text-t-accent glow">movement.</span>
            </h2>
            <p className="mt-8 font-sans text-[clamp(1rem,1.3vw,1.15rem)] leading-[1.7] text-t-surface/60 max-w-[40ch] mx-auto">
              Donate, attend a meetup, or just spread the word.
              Every action compounds.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/donate"
                className="font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-10 py-4 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
              >
                → donate now
              </a>
              <a
                href="/events"
                className="font-mono text-[0.78rem] lowercase tracking-[0.06em] text-t-surface/70 border border-t-surface/30 px-10 py-4 hover:border-t-accent hover:text-t-accent transition-all duration-200"
              >
                see events
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
