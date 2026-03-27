"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const adminLinks = [
  { label: "dashboard", href: "/admin" },
  { label: "posts", href: "/admin/posts" },
  { label: "events", href: "/admin/events" },
  { label: "resources", href: "/admin/resources" },
  { label: "media", href: "/admin/media" },
  { label: "users", href: "/admin/users" },
  { label: "newsletter", href: "/admin/newsletter" },
  { label: "agent keys", href: "/admin/agent-keys" },
  { label: "meetup", href: "/admin/meetup" },
  { label: "zaprite", href: "/admin/zaprite" },
  { label: "doctor", href: "/admin/doctor" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  // Don't show admin nav on login/signup/reset pages
  const isAuthPage =
    pathname === "/admin/login" ||
    pathname === "/admin/signup" ||
    pathname === "/admin/reset-password";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (isAuthPage) return null;

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-t-dark/95 backdrop-blur-md border-b border-t-surface/20"
          : "bg-t-dark border-b border-t-surface/8"
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 h-[72px] flex items-center justify-between">
        {/* Left: logo + back to site */}
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-3 group">
            <Image
              src="/brand/logo.svg"
              alt="Admin"
              width={32}
              height={32}
            />
            <span className="font-mono text-[0.8rem] font-bold tracking-tight text-t-accent">
              admin
            </span>
          </Link>
          <span className="font-mono text-[0.6rem] text-t-surface/35">
            /
          </span>
          <span className="font-mono text-[0.65rem] text-t-accent">
            admin
          </span>
        </div>

        {/* Center: admin links */}
        <div className="hidden lg:flex items-center gap-6">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`font-mono text-[0.68rem] lowercase transition-colors duration-200 ${
                isActive(link.href)
                  ? "text-t-accent"
                  : "text-t-surface/65 hover:text-t-surface"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: back to site + sign out */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-mono text-[0.65rem] lowercase text-t-surface/55 hover:text-t-surface transition-colors cursor-pointer"
          >
            back to site
          </Link>
          <button
            onClick={handleSignOut}
            className="font-mono text-[0.65rem] lowercase text-t-surface/55 hover:text-t-accent-alt transition-colors cursor-pointer"
          >
            sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
