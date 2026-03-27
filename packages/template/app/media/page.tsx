import { genMetadata } from "@/lib/og";
import config from "@/site.config";

export const metadata = genMetadata({
  path: "/media",
  title: `Media — ${config.org.name}`,
  image: "/og/media.jpg",
  description:
    `${config.org.name} media coverage, podcasts, and press mentions.`,
});

export default function MediaPage() {
  return (
    <main className="bg-t-dark min-h-screen">
      {/* Terminal header */}
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-24 lg:pt-32 pb-4">
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-4 flex items-center gap-2">
          <span className="text-t-accent">$</span>
          <span className="text-t-surface/70">open /media/archive</span>
        </div>
        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(2.4rem,6vw,5rem)]">
          media<span className="text-t-accent glow">.</span>
        </h1>
        <p className="font-sans text-t-surface/70 max-w-2xl mt-6 text-sm leading-relaxed">
          {config.org.name} in the press, on podcasts, and across the web.
          Browse our media archive below — featuring interviews, event coverage,
          panel discussions, and community highlights from {config.location.city}&apos;s
          Bitcoin meetups and events.
        </p>
      </div>

      {/* Iframe embed */}
      <div className="w-full" style={{ height: "calc(100vh - 72px)" }}>
        <iframe
          src="https://www.pullthatupjamie.ai/app?sharedSession=c4086f3f1e20&embed=true"
          className="w-full h-full border-0"
          title={`Media — ${config.org.name}`}
          allow="clipboard-write"
        />
      </div>
    </main>
  );
}
