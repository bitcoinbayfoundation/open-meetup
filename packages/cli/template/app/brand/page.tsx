import Image from "next/image";
import { genMetadata } from "@/lib/og";
import config from "@/site.config";

export const metadata = genMetadata({
  path: "/brand",
  title: `Brand Kit — ${config.org.name}`,
  description:
    `Download ${config.org.name} logos, brand colors, and media assets. Official branding resources for ${config.location.city}'s Bitcoin nonprofit.`,
});

const colors = [
  { name: "accent", hex: config.theme.colors.accent, desc: "primary accent · buttons · links" },
  { name: "dark", hex: config.theme.colors.dark, desc: "background" },
  { name: "dark alt", hex: config.theme.colors.darkAlt, desc: "cards · secondary bg" },
  { name: "primary", hex: config.theme.colors.primary, desc: "primary dark" },
  { name: "accent alt", hex: config.theme.colors.accentAlt, desc: "errors · warnings" },
  { name: "highlight", hex: config.theme.colors.highlight, desc: "highlights · info" },
  { name: "warm", hex: config.theme.colors.warm, desc: "warm accent" },
  { name: "surface", hex: config.theme.colors.surface, desc: "text · light surfaces" },
];

const brandAssets: Array<{ label: string; file: string; desc: string }> = [
  { label: "logo", file: "/brand/logo.svg", desc: "primary logo" },
];

export default function BrandPage() {
  return (
    <main className="bg-t-dark min-h-screen scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        {/* Header */}
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6 flex items-center gap-2">
          <span className="text-t-accent">$</span>
          <span className="text-t-surface/70">cat /brand/README.md</span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(3rem,8vw,7rem)] mb-8">
          brand<span className="text-t-accent glow">.</span>
        </h1>

        <div className="max-w-[72ch] mb-20">
          <div className="border-l-2 border-t-accent/40 pl-6">
            <p className="font-sans text-[clamp(0.95rem,1.2vw,1.1rem)] leading-[1.8] text-t-surface/70">
              Everything you need to represent {config.org.name}. Download
              our logos, grab our colors, and keep things consistent.
            </p>
          </div>
        </div>

        {/* ── Logos ── */}
        <section className="border-t border-t-surface/10 pt-12 mb-20">
          <p className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
            <span className="text-t-accent">$</span> ls ./logos
          </p>
          <h2 className="font-mono font-bold lowercase leading-[0.9] tracking-[-0.02em] text-t-surface text-[clamp(1.8rem,4vw,3rem)] mb-10">
            logos<span className="text-t-accent">.</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {brandAssets.map((d) => (
              <div
                key={d.label}
                className="border border-t-surface/10 group hover:border-t-accent/30 transition-colors"
              >
                <div className="relative h-40 bg-t-surface/5 flex items-center justify-center p-6">
                  <Image
                    src={d.file}
                    alt={d.label}
                    width={160}
                    height={160}
                    className="max-h-28 w-auto object-contain"
                  />
                </div>
                <div className="p-4 border-t border-t-surface/10">
                  <p className="font-mono text-sm text-t-surface lowercase mb-1">
                    {d.label}
                  </p>
                  <p className="font-sans text-[0.75rem] text-t-surface/40 mb-3">
                    {d.desc}
                  </p>
                  <a
                    href={d.file}
                    download
                    className="font-mono text-[0.68rem] lowercase text-t-accent hover:text-t-surface transition-colors"
                  >
                    download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Colors ── */}
        <section className="border-t border-t-surface/10 pt-12 mb-20">
          <p className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
            <span className="text-t-accent">$</span> cat ./colors.json
          </p>
          <h2 className="font-mono font-bold lowercase leading-[0.9] tracking-[-0.02em] text-t-surface text-[clamp(1.8rem,4vw,3rem)] mb-10">
            colors<span className="text-t-accent">.</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {colors.map((c) => {
              const isLight = ["surface", "warm", "white"].some((k) => c.name.includes(k));
              return (
                <div key={c.hex} className="group">
                  <div
                    className="h-24 border border-t-surface/10 mb-3"
                    style={{ backgroundColor: c.hex }}
                  />
                  <p className={`font-mono text-sm lowercase ${isLight ? "text-t-surface" : "text-t-surface"}`}>
                    {c.name}
                  </p>
                  <p className="font-mono text-[0.7rem] text-t-accent">
                    {c.hex}
                  </p>
                  <p className="font-sans text-[0.65rem] text-t-surface/40 mt-1">
                    {c.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Typography ── */}
        <section className="border-t border-t-surface/10 pt-12 mb-20">
          <p className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
            <span className="text-t-accent">$</span> fc-list --brand
          </p>
          <h2 className="font-mono font-bold lowercase leading-[0.9] tracking-[-0.02em] text-t-surface text-[clamp(1.8rem,4vw,3rem)] mb-10">
            typography<span className="text-t-accent">.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[800px]">
            <div className="border border-t-surface/10 p-6">
              <p className="font-mono text-[0.6rem] text-t-surface/40 mb-4">
                headings + ui
              </p>
              <p className="font-mono text-2xl font-bold text-t-surface lowercase mb-2">
                {config.theme.fonts.mono.toLowerCase()}
              </p>
              <p className="font-mono text-sm text-t-surface/60">
                AaBbCcDdEeFf 0123456789
              </p>
            </div>
            <div className="border border-t-surface/10 p-6">
              <p className="font-mono text-[0.6rem] text-t-surface/40 mb-4">
                body text
              </p>
              <p className="font-sans text-2xl font-bold text-t-surface mb-2">
                {config.theme.fonts.sans}
              </p>
              <p className="font-sans text-sm text-t-surface/60">
                AaBbCcDdEeFf 0123456789
              </p>
            </div>
          </div>
        </section>

        {/* ── Usage guidelines ── */}
        <section className="border-t border-t-surface/10 pt-12">
          <p className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
            <span className="text-t-accent">$</span> cat ./guidelines.txt
          </p>
          <h2 className="font-mono font-bold lowercase leading-[0.9] tracking-[-0.02em] text-t-surface text-[clamp(1.8rem,4vw,3rem)] mb-10">
            guidelines<span className="text-t-accent">.</span>
          </h2>

          <div className="max-w-[60ch] space-y-6">
            {[
              {
                rule: "use the logo on dark backgrounds",
                detail:
                  "The primary logo is designed for dark backgrounds. Use the transparent version when placing over images or lighter surfaces.",
              },
              {
                rule: "don't modify the logo",
                detail:
                  "Don't stretch, rotate, recolor, or add effects to the logo. Use it as provided.",
              },
              {
                rule: "maintain clear space",
                detail:
                  "Keep adequate padding around the logo on all sides.",
              },
              {
                rule: `${config.theme.colors.accent} is the primary accent`,
                detail:
                  `Use the accent color for CTAs, highlights, and emphasis. Pair with surface text on dark backgrounds.`,
              },
            ].map((g) => (
              <div
                key={g.rule}
                className="border-l-2 border-t-surface/10 pl-5"
              >
                <p className="font-mono text-sm text-t-surface lowercase font-bold mb-1">
                  {g.rule}
                </p>
                <p className="font-sans text-[0.85rem] text-t-surface/50 leading-relaxed">
                  {g.detail}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
