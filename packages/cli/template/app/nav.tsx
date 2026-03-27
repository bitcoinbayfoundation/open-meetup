"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import config from "@/site.config";

const links = config.nav.links;

const PRODUCTION_HOSTS = [config.contact.domain, "www." + config.contact.domain];

function EnvironmentPill() {
  const [env, setEnv] = useState<{ label: string; url: string } | null>(null);

  useEffect(() => {
    const host = window.location.hostname;
    if (PRODUCTION_HOSTS.includes(host)) return;

    let label = "dev";
    if (host.includes("vercel.app")) label = "preview";
    if (host.includes("staging")) label = "staging";

    setEnv({ label, url: window.location.origin });
  }, []);

  if (!env) return null;

  const colors: Record<string, string> = {
    preview: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    staging: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    dev: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };

  return (
    <div className="absolute top-2 right-2 z-10 group">
      <span
        className={`font-mono text-[0.55rem] uppercase tracking-widest px-2 py-0.5 rounded-full border ${colors[env.label]}`}
      >
        {env.label}
      </span>
      <span className="absolute right-0 top-full mt-1.5 font-mono text-[0.55rem] text-t-surface/60 bg-t-dark/95 border border-t-surface/10 rounded px-3 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {env.url}
      </span>
    </div>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Hide main nav on admin pages (admin has its own nav)
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "bg-t-dark/95 backdrop-blur-md border-b border-t-surface/10"
          : "bg-transparent"
      }`}>
        <div className="mx-auto max-w-[1400px] px-6 lg:px-12 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/brand/logo.svg" alt={config.org.shortName} width={38} height={38} />
            <span className="font-mono text-[0.9rem] font-bold tracking-tight">
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

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-8">
            {links.map((link) => (
              <Link
                key={link}
                href={`/${link}`}
                className={`font-mono text-[0.68rem] lowercase transition-colors duration-200 ${
                  pathname === `/${link}`
                    ? "text-t-accent"
                    : "text-t-surface/70 hover:text-t-accent"
                }`}
              >
                {link}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/donate"
              className="hidden lg:block font-mono text-[0.68rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-5 py-2 hover:bg-t-surface hover:text-t-dark transition-all duration-200"
            >
              donate
            </Link>

            {/* Hamburger button */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-[5px]"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <span className={`block w-5 h-[1.5px] bg-t-surface transition-all duration-300 ${
                open ? "rotate-45 translate-y-[6.5px]" : ""
              }`} />
              <span className={`block w-5 h-[1.5px] bg-t-surface transition-all duration-300 ${
                open ? "opacity-0 scale-x-0" : ""
              }`} />
              <span className={`block w-5 h-[1.5px] bg-t-surface transition-all duration-300 ${
                open ? "-rotate-45 -translate-y-[6.5px]" : ""
              }`} />
            </button>
          </div>
        </div>
        <EnvironmentPill />
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 bg-t-dark/98 backdrop-blur-lg transition-all duration-300 lg:hidden ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-2">
          {links.map((link, i) => (
            <Link
              key={link}
              href={`/${link}`}
              className={`font-mono text-[1.4rem] lowercase tracking-wide py-3 transition-all duration-300 ${
                pathname === `/${link}`
                  ? "text-t-accent"
                  : "text-t-surface/80 hover:text-t-accent"
              } ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              style={{ transitionDelay: open ? `${i * 50 + 100}ms` : "0ms" }}
            >
              {link}
            </Link>
          ))}
          <Link
            href="/donate"
            className={`mt-6 font-mono text-[0.78rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-8 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-300 ${
              open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: open ? `${links.length * 50 + 150}ms` : "0ms" }}
          >
            donate
          </Link>
        </div>
      </div>
    </>
  );
}
