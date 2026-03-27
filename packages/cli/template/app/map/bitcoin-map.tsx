"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useBTCMap } from "@/hooks/use-btcmap";
import type { BTCMapPlace } from "@/types/btcmap";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./map-view"), { ssr: false });

interface BitcoinMapProps {
  city: string;
  areaDescription: string;
  mapCenter?: { lat: number; lng: number };
}

// Default to geographic center of US if no mapCenter configured
const DEFAULT_CENTER = { lat: 39.8283, lng: -98.5795 };

// Map BTC Map icon values to human-readable categories
const CATEGORY_MAP: Record<string, string> = {
  restaurant: "food & drink",
  lunch_dining: "food & drink",
  local_cafe: "food & drink",
  sports_bar: "food & drink",
  local_atm: "atm",
  home: "real estate",
  storefront: "retail",
  content_cut: "services",
  design_services: "services",
  engineering: "services",
  build: "services",
  construction: "services",
  car_repair: "automotive",
  directions_car: "automotive",
  computer: "technology",
  hardware: "technology",
  medical_services: "health",
  dentistry: "health",
  fitness_center: "health",
  spa: "health",
  sauna: "health",
  diamond: "retail",
  watch: "retail",
  lock: "services",
  palette: "services",
  photo_camera: "services",
  local_florist: "retail",
  grass: "services",
  celebration: "entertainment",
  toys: "entertainment",
  videogame_asset: "entertainment",
  vaping_rooms: "retail",
  colorize: "services",
  group: "community",
  business: "business",
};

export function getCategory(icon: string): string {
  return CATEGORY_MAP[icon] || "other";
}

export default function BitcoinMap({ city, areaDescription, mapCenter }: BitcoinMapProps) {
  const center = mapCenter ?? DEFAULT_CENTER;
  const { places, loading, error } = useBTCMap({
    lat: center.lat,
    lon: center.lng,
    radius_km: 50,
  });

  const [showMap, setShowMap] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    if (categoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [categoryDropdownOpen]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of places) {
      const cat = getCategory(p.icon);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [places]);

  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (activeCategory && getCategory(p.icon) !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.address?.toLowerCase().includes(q) ?? false) ||
          (p.description?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [places, search, activeCategory]);

  // Fullscreen map overlay
  if (showMap) {
    return (
      <MapView
        places={filtered}
        onClose={() => setShowMap(false)}
        loading={loading}
        center={center}
      />
    );
  }

  // List view — normal page flow
  return (
    <main className="min-h-screen bg-t-dark scanlines">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12 pt-32 lg:pt-44 pb-24 lg:pb-36">
        {/* Page header */}
        <div className="font-mono text-[0.65rem] text-t-surface/50 mb-6">
          <span className="text-t-accent">$</span>{" "}
          <span className="text-t-surface/70">
            btcmap --locate --radius 50km --center &quot;{city.toLowerCase()}&quot;
          </span>
        </div>

        <h1 className="font-mono font-bold lowercase leading-[0.88] tracking-[-0.03em] text-t-surface text-[clamp(3rem,8vw,7rem)] mb-6">
          bitcoin map<span className="text-t-accent glow">.</span>
        </h1>

        <p className="text-t-surface/60 text-lg mb-16 max-w-2xl leading-relaxed">
          Find Bitcoin-accepting merchants, ATMs, and services in {areaDescription}.
          Powered by{" "}
          <a
            href="https://btcmap.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-t-accent hover:text-t-surface transition-colors underline underline-offset-2"
          >
            BTC Map
          </a>
          .
        </p>

        {/* Section heading */}
        <div className="flex items-center gap-4 mb-8">
          <h2 className="font-mono font-bold lowercase text-t-surface text-xl shrink-0">
            {loading ? (
              <span className="animate-pulse">loading...</span>
            ) : (
              <>
                {filtered.length} locations accepting bitcoin
                {activeCategory ? ` in ${activeCategory}` : ""}
                <span className="text-t-accent">.</span>
              </>
            )}
          </h2>
          <div className="flex-1 border-t border-t-surface/10 hidden sm:block" />
          <button
            onClick={() => setShowMap(true)}
            disabled={loading}
            className="shrink-0 font-mono text-[0.75rem] font-semibold lowercase tracking-[0.06em] bg-t-accent text-t-surface px-8 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            → show map
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setExpandedIndex(null); }}
          placeholder="search locations..."
          className="w-full bg-t-surface/5 border border-t-surface/20 px-4 py-3 text-t-surface placeholder:text-t-surface/30 font-mono text-sm focus:border-t-accent focus:outline-none transition-colors mb-4"
        />

        {/* Category filters — custom dropdown on mobile, buttons on desktop */}
        <div ref={categoryDropdownRef} className="sm:hidden relative mb-6">
          <button
            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            className="w-full text-left bg-t-surface/5 border border-t-surface/20 px-4 py-3 text-t-surface font-mono text-sm transition-colors cursor-pointer flex items-center justify-between"
          >
            <span>{activeCategory ? `${activeCategory} (${categories.find(c => c.name === activeCategory)?.count ?? 0})` : `all categories (${places.length})`}</span>
            <span className="text-t-surface/45 text-[0.5rem]">▼</span>
          </button>
          {categoryDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-30 border border-t-surface/25 bg-t-dark max-h-[60vh] overflow-y-auto shadow-lg">
              <button
                onClick={() => { setActiveCategory(null); setExpandedIndex(null); setCategoryDropdownOpen(false); }}
                className={`w-full text-left font-mono text-[0.8rem] px-4 py-3 transition-colors cursor-pointer ${
                  !activeCategory
                    ? "text-t-accent bg-t-accent/10"
                    : "text-t-surface/65 hover:text-t-accent hover:bg-t-surface/5"
                }`}
              >
                all categories ({places.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => { setActiveCategory(cat.name); setExpandedIndex(null); setCategoryDropdownOpen(false); }}
                  className={`w-full text-left font-mono text-[0.8rem] px-4 py-3 transition-colors cursor-pointer ${
                    activeCategory === cat.name
                      ? "text-t-accent bg-t-accent/10"
                      : "text-t-surface/65 hover:text-t-accent hover:bg-t-surface/5"
                  }`}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hidden sm:flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setActiveCategory(null); setExpandedIndex(null); }}
            className={`font-mono text-[0.65rem] lowercase px-3 py-1.5 border transition-colors cursor-pointer ${
              !activeCategory
                ? "border-t-accent text-t-accent bg-t-accent/10"
                : "border-t-surface/20 text-t-surface/55 hover:border-t-accent/40 hover:text-t-accent"
            }`}
          >
            all ({places.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => { setActiveCategory(activeCategory === cat.name ? null : cat.name); setExpandedIndex(null); }}
              className={`font-mono text-[0.65rem] lowercase px-3 py-1.5 border transition-colors cursor-pointer ${
                activeCategory === cat.name
                  ? "border-t-accent text-t-accent bg-t-accent/10"
                  : "border-t-surface/20 text-t-surface/55 hover:border-t-accent/40 hover:text-t-accent"
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        {/* Location list */}
        {!loading && filtered.length === 0 ? (
          <p className="font-mono text-[0.8rem] text-t-surface/45 py-8 text-center">
            no locations match your search.
          </p>
        ) : loading ? (
          <p className="font-mono text-[0.8rem] text-t-surface/45 py-8 text-center animate-pulse">
            loading bitcoin locations...
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((place, i) => (
              <PlaceCard
                key={`${place.id}-${i}`}
                place={place}
                isExpanded={expandedIndex === i}
                onToggle={() => setExpandedIndex(expandedIndex === i ? null : i)}
              />
            ))}
          </div>
        )}

        {/* BTC Map attribution */}
        <div className="mt-16 border border-t-surface/15 p-8 lg:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <a
              href="https://btcmap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <img
                src="/brand/btcmap.svg"
                alt="BTC Map"
                className="h-10 w-auto opacity-80 hover:opacity-100 transition-opacity"
              />
            </a>
            <div>
              <p className="font-sans text-[0.9rem] text-t-surface/70 leading-relaxed mb-3">
                Location data powered by{" "}
                <a
                  href="https://btcmap.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-t-accent hover:text-t-surface transition-colors font-semibold"
                >
                  BTC Map
                </a>
                {" "}— an open-source project mapping Bitcoin-accepting
                businesses worldwide. Thank you to the BTC Map community for
                maintaining this incredible resource for the Bitcoin ecosystem.
              </p>
              <a
                href="https://btcmap.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[0.7rem] lowercase text-t-surface/50 hover:text-t-accent transition-colors"
              >
                visit btcmap.org →
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Expandable place card
function PlaceCard({ place, isExpanded, onToggle }: { place: BTCMapPlace; isExpanded: boolean; onToggle: () => void }) {
  const category = getCategory(place.icon);
  return (
    <div
      className={`border transition-colors ${
        isExpanded
          ? "border-t-accent/40 bg-t-accent/5"
          : "border-t-surface/15 hover:border-t-surface/30"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-4 cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className={`font-mono text-[0.8rem] font-semibold truncate transition-colors ${
                isExpanded ? "text-t-accent" : "text-t-surface group-hover:text-t-accent"
              }`}>
                {place.name}
              </p>
              <span className="shrink-0 font-mono text-[0.55rem] px-2 py-0.5 border border-t-surface/20 text-t-surface/45">
                {category}
              </span>
            </div>
            {!isExpanded && place.address && (
              <p className="font-mono text-[0.65rem] text-t-surface/50 truncate">
                {place.address}
              </p>
            )}
          </div>
          <span className={`shrink-0 font-mono text-[0.7rem] transition-colors ${
            isExpanded ? "text-t-accent" : "text-t-surface/30 group-hover:text-t-accent"
          }`}>
            {isExpanded ? "−" : "+"}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-5 space-y-4">
          {place.description && (
            <p className="font-sans text-[0.85rem] text-t-surface/70 leading-relaxed">
              {place.description}
            </p>
          )}

          {place.address && (
            <DetailField label="address" orange>
              <p className="font-mono text-[0.8rem] text-t-surface">{place.address}</p>
            </DetailField>
          )}

          {place.website && (
            <DetailField label="website" orange>
              <a href={place.website} target="_blank" rel="noopener noreferrer"
                className="font-mono text-[0.8rem] text-t-accent hover:text-t-surface transition-colors break-all">
                {place.website}
              </a>
            </DetailField>
          )}

          {place.phone && (
            <DetailField label="phone" orange>
              <p className="font-mono text-[0.8rem] text-t-surface">{place.phone}</p>
            </DetailField>
          )}

          {place.email && (
            <DetailField label="email" orange>
              <a href={`mailto:${place.email}`}
                className="font-mono text-[0.8rem] text-t-accent hover:text-t-surface transition-colors">
                {place.email}
              </a>
            </DetailField>
          )}

          {place.opening_hours && (
            <DetailField label="hours">
              <p className="font-mono text-[0.75rem] text-t-surface/60">{place.opening_hours}</p>
            </DetailField>
          )}

          {(place.facebook || place.instagram || place.twitter) && (
            <DetailField label="social">
              <div className="flex gap-3">
                {place.facebook && <SocialLink href={place.facebook} label="facebook" />}
                {place.instagram && <SocialLink href={place.instagram} label="instagram" />}
                {place.twitter && <SocialLink href={place.twitter} label="twitter" />}
              </div>
            </DetailField>
          )}

          {place.image && (
            <DetailField label="photo" orange>
              <img src={place.image} alt={place.name} className="max-w-full max-h-48 object-cover border border-t-surface/10" />
            </DetailField>
          )}

          {place.payment_provider && (
            <DetailField label="payment" orange>
              <p className="font-mono text-[0.8rem] text-t-surface">{place.payment_provider}</p>
            </DetailField>
          )}

          {place.comments && (
            <DetailField label="notes">
              <p className="font-sans text-[0.8rem] text-t-surface/60 leading-relaxed">{place.comments}</p>
            </DetailField>
          )}

          <DetailField label="coordinates">
            <p className="font-mono text-[0.75rem] text-t-surface/60">
              {place.lat.toFixed(6)}, {place.lon.toFixed(6)}
            </p>
          </DetailField>

          {place.verified_at && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[0.55rem] px-2 py-0.5 border border-green-500/30 text-green-400">
                verified
              </span>
              <span className="font-mono text-[0.55rem] text-t-surface/35">
                {new Date(place.verified_at).toLocaleDateString()}
              </span>
            </div>
          )}

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + (place.address ? " " + place.address : ""))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-mono text-[0.72rem] font-semibold lowercase tracking-[0.04em] bg-t-accent text-t-surface px-5 py-2.5 hover:bg-t-surface hover:text-t-dark transition-all duration-200 cursor-pointer mt-2"
          >
            open in google maps →
          </a>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, orange, children }: { label: string; orange?: boolean; children: React.ReactNode }) {
  return (
    <div className={`border-l-2 pl-4 ${orange ? "border-t-accent" : "border-t-surface/20"}`}>
      <p className="font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider mb-1">{label}</p>
      {children}
    </div>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="font-mono text-[0.7rem] text-t-surface/50 hover:text-t-accent transition-colors">
      {label}
    </a>
  );
}
