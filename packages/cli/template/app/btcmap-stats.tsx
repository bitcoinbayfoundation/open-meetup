"use client";

import { useState, useEffect, useRef } from "react";

const CATEGORY_MAP: Record<string, string> = {
  restaurant: "food & drink", lunch_dining: "food & drink", local_cafe: "food & drink",
  sports_bar: "food & drink", local_atm: "atm", home: "real estate",
  storefront: "retail", content_cut: "services", design_services: "services",
  engineering: "services", build: "services", construction: "services",
  car_repair: "automotive", directions_car: "automotive", computer: "technology",
  hardware: "technology", medical_services: "health", dentistry: "health",
  fitness_center: "health", spa: "health", sauna: "health", diamond: "retail",
  watch: "retail", lock: "services", palette: "services", photo_camera: "services",
  local_florist: "retail", grass: "services", celebration: "entertainment",
  toys: "entertainment", videogame_asset: "entertainment", vaping_rooms: "retail",
  colorize: "services", group: "community", business: "business",
};

function getCategory(icon: string): string {
  return CATEGORY_MAP[icon] || "other";
}

// Top categories to show (in display order)
const DISPLAY_CATEGORIES = ["food & drink", "health", "services", "retail", "technology"];

interface CategoryCount {
  label: string;
  count: string;
}

export default function BTCMapStats({ lat, lng }: { lat: number; lng: number }) {
  const [categories, setCategories] = useState<CategoryCount[]>(
    [...DISPLAY_CATEGORIES.map((c) => ({ label: c, count: "-" })), { label: "& more", count: "-" }]
  );
  const [fetched, setFetched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fetched) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          fetchStats();
        }
      },
      { rootMargin: "200px" }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [fetched]);

  async function fetchStats() {
    try {
      const res = await fetch(
        `https://api.btcmap.org/v4/places/search/?lat=${lat}&lon=${lng}&radius_km=50`
      );
      if (!res.ok) return;
      const places: Array<{ icon: string }> = await res.json();

      const counts: Record<string, number> = {};
      for (const p of places) {
        const cat = getCategory(p.icon);
        counts[cat] = (counts[cat] || 0) + 1;
      }

      const displayed = DISPLAY_CATEGORIES.map((c) => ({
        label: c,
        count: counts[c] ? `${counts[c]}+` : "0",
      }));

      const displayedTotal = DISPLAY_CATEGORIES.reduce((sum, c) => sum + (counts[c] || 0), 0);
      const remaining = places.length - displayedTotal;

      displayed.push({
        label: "& more",
        count: remaining > 0 ? `${remaining}+` : "...",
      });

      setCategories(displayed);
    } catch {
      // Leave as dashes
    } finally {
      setFetched(true);
    }
  }

  return (
    <div ref={ref} className="grid grid-cols-3 gap-3">
      {categories.map((cat) => (
        <a
          key={cat.label}
          href="/map"
          className="bg-t-white border-l-4 border-l-t-accent p-5 hover:translate-x-1 transition-transform duration-300 group"
        >
          <span className="font-mono text-[clamp(1.2rem,2vw,1.6rem)] font-bold text-t-dark block leading-none mb-1">
            {cat.count}
          </span>
          <span className="font-mono text-[0.65rem] text-t-dark/50 lowercase">
            {cat.label}
          </span>
        </a>
      ))}
    </div>
  );
}
