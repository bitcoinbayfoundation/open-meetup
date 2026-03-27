"use client";

import { useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import config from "@/site.config";

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      } else {
        setStatus("success");
        setMessage("you're in.");
        setEmail("");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong.");
    }
  }

  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-t-dark border-t border-t-surface/8">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-16 pb-8">
        <div className="grid grid-cols-12 gap-y-10 gap-x-8">
          <div className="col-span-12 lg:col-span-4">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/brand/logo.svg" alt={config.org.shortName} width={32} height={32} />
              <span className="font-mono text-[0.85rem] font-bold tracking-tight">
                {config.org.shortName.split(" ").length > 1 ? (
                  <>
                    <span className="text-t-surface">{config.org.shortName.split(" ").slice(0, -1).join(" ")}</span>
                    <span className="text-t-accent">{config.org.shortName.split(" ").slice(-1)[0]}</span>
                  </>
                ) : (
                  <span className="text-t-accent">{config.org.shortName}</span>
                )}
              </span>
            </Link>
            <p className="mt-4 font-sans text-[0.82rem] text-t-surface/60 max-w-[28ch] leading-relaxed">
              A {config.legal.nonprofitStatus} nonprofit building the Bitcoin community in {config.location.city}, {config.location.state}.
            </p>
            <address className="mt-3 not-italic font-mono text-[0.7rem] text-t-surface/60 leading-relaxed">
              {config.location.streetAddress}<br />
              {config.location.locality}, {config.location.stateAbbrev} {config.location.postalCode}<br />
              <a href={`mailto:${config.contact.email}`} className="hover:text-t-accent transition-colors">
                {config.contact.email}
              </a>
            </address>
            <div className="mt-6 flex items-center gap-3">
              {[
                ...(config.socials.x ? [{ label: "X", href: config.socials.x }] : []),
                ...(config.socials.youtube ? [{ label: "YT", href: config.socials.youtube }] : []),
                ...(config.socials.instagram ? [{ label: "IG", href: config.socials.instagram }] : []),
                ...(config.socials.facebook ? [{ label: "FB", href: config.socials.facebook }] : []),
                ...(config.socials.github ? [{ label: "GH", href: config.socials.github }] : []),
                ...(config.socials.nostr ? [{ label: "N", href: config.socials.nostr }] : []),
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center border border-t-surface/12 font-mono text-[0.55rem] font-bold text-t-surface/50 hover:text-t-accent hover:border-t-accent/40 transition-all duration-200"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7 grid grid-cols-2 gap-6">
            {[
              {
                heading: "Foundation",
                links: [
                  { label: "About", href: "/about" },
                  { label: "Events", href: "/events" },
                  { label: "Donate", href: "/donate" },
                  { label: "Photos", href: "/photos" },
                ],
              },
              {
                heading: "Resources",
                links: [
                  { label: "Education", href: "/education" },
                  { label: "Bitcoin Map", href: "/map" },
                  { label: "Media", href: "/media" },
                  { label: "Brand Kit", href: "/brand" },
                  { label: "Contact", href: "/contact" },
                ],
              },
            ].map((col) => (
              <div key={col.heading}>
                <h4 className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-t-accent mb-4">
                  {col.heading}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="font-sans text-[0.8rem] text-t-surface/60 hover:text-t-surface transition-colors duration-200">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {/* Newsletter subscribe */}
        <div className="mt-12 pt-8 border-t border-t-surface/8">
          <div className="max-w-md">
            <h4 className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-t-accent mb-3">
              Stay in the loop
            </h4>
            <p className="font-sans text-[0.8rem] text-t-surface/50 mb-4">
              Bitcoin news, events, and updates from {config.location.city}.
            </p>
            {status === "success" ? (
              <p className="font-mono text-[0.75rem] text-t-accent">{message}</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="satoshi@example.com"
                  className="flex-1 bg-t-surface/5 border border-t-surface/15 px-4 py-2.5 text-t-surface placeholder:text-t-surface/30 font-mono text-[0.75rem] focus:border-t-accent focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="font-mono text-[0.68rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-dark px-5 py-2.5 hover:bg-t-surface hover:text-t-dark transition-all duration-200 disabled:opacity-50"
                >
                  {status === "loading" ? "..." : "subscribe"}
                </button>
              </form>
            )}
            {status === "error" && (
              <p className="mt-2 font-mono text-[0.65rem] text-t-accent-alt">{message}</p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-t-surface/8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="font-mono text-[0.6rem] text-t-surface/50 tracking-widest uppercase">
            &copy; {new Date().getFullYear()} {config.org.name} &middot; {config.location.city}, {config.location.stateAbbrev} &middot; EIN: {config.legal.ein}{config.legal.stateRegistration ? <> &middot; {config.legal.stateRegistration}</> : null}
          </p>
          <p className="font-mono text-[0.6rem] text-t-surface/30">
            built with{" "}
            <a href="https://github.com/ArcadeLabsInc/open-meetup" className="text-t-surface/50 hover:text-t-accent transition-colors">
              open meetup
            </a>
            {" "}by{" "}
            <a href="https://bitcoinbay.foundation" className="text-t-surface/50 hover:text-t-accent transition-colors">
              bitcoin bay
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
