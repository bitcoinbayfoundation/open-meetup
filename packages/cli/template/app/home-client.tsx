"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback, type ReactNode } from "react";

/* ══════════════════════════════════════════════
   REVEAL — fade-up on scroll
   ══════════════════════════════════════════════ */

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setTimeout(() => setVisible(true), delay);
      return;
    }

    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          obs.unobserve(el);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`${visible ? "fade-up" : "opacity-0"} ${className}`}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════
   TYPEWRITER — terminal typing effect
   ══════════════════════════════════════════════ */

export function TypeWriter({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setStarted(true), delay);
          obs.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, 45);
    return () => clearInterval(iv);
  }, [started, text]);

  return (
    <span ref={ref} className={className}>
      {displayed}
      <span className="cursor text-t-accent">█</span>
    </span>
  );
}

/* ══════════════════════════════════════════════
   VIDEO BACKGROUND
   ══════════════════════════════════════════════ */

export function VideoBackground({ fallbackSrc }: { fallbackSrc: string }) {
  const [loaded, setLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    // Defer the 3.9 MB video until the browser is idle so it doesn't
    // compete with FCP / LCP critical resources.
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setShowVideo(true));
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(() => setShowVideo(true), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Image src={fallbackSrc} alt="" fill priority sizes="100vw" className="object-cover" />
      {showVideo && (
        <video
          autoPlay loop muted playsInline
          onLoadedData={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${loaded ? "opacity-100" : "opacity-0"}`}
        >
          <source src="https://gf3ot543c0hsecwt.public.blob.vercel-storage.com/site/brand/landing-bg-video.mp4" type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-t-dark/50 via-t-dark/60 to-t-dark/95" />
    </div>
  );
}

/* ══════════════════════════════════════════════
   MOUSE GLOW
   ══════════════════════════════════════════════ */

export function MouseGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent) => {
    if (ref.current) {
      ref.current.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(231,105,21,0.06), transparent 60%)`;
    }
  }, []);
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className="absolute inset-0 z-[1] pointer-events-auto"
      style={{ pointerEvents: "none" }}
    />
  );
}

/* ══════════════════════════════════════════════
   LAZY IFRAME — only mounts when near viewport
   ══════════════════════════════════════════════ */

export function LazyIframe(props: React.IframeHTMLAttributes<HTMLIFrameElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setMount(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {mount ? <iframe {...props} /> : null}
    </div>
  );
}

/* ══════════════════════════════════════════════
   HORIZONTAL TICKER
   ══════════════════════════════════════════════ */

const tickerItems = [
  "501(c)(3) nonprofit",
  "★",
  "bitcoin education for all",
  "★",
  "community meetups & events",
  "★",
  "sound money is a human right",
  "★",
  "open to all skill levels",
  "★",
  "verify, don't trust",
  "★",
];

export function Ticker() {
  const doubled = [...tickerItems, ...tickerItems];
  return (
    <div className="overflow-hidden border-y border-t-accent/20 bg-t-dark">
      <div className="flex ticker-track w-max py-4">
        {doubled.map((item, i) => (
          <span
            key={i}
            className={`shrink-0 px-6 font-mono text-[0.7rem] uppercase tracking-[0.2em] ${
              item === "★" ? "text-t-accent" : "text-t-surface/70"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
