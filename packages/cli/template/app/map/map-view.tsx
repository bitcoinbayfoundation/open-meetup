"use client";

import { memo, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import type { BTCMapPlace } from "@/types/btcmap";
import { getCategory } from "./bitcoin-map";

const containerStyle = { width: "100%", height: "100%" };

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a9a" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a3e" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6a6a7a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e1a" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4a4a5a" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#22223a" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6a6a7a" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#22223a" }] },
];

function MapView({
  places,
  onClose,
  loading,
  center,
}: {
  places: BTCMapPlace[];
  onClose: () => void;
  loading: boolean;
  center: { lat: number; lng: number };
}) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const [drawerPlace, setDrawerPlace] = useState<BTCMapPlace | null>(null);

  const handleMarkerClick = useCallback((place: BTCMapPlace) => {
    setDrawerPlace(place);
  }, []);

  if (!isLoaded) {
    return (
      <main className="h-screen w-full bg-t-dark flex items-center justify-center">
        <p className="font-mono text-t-surface/60 animate-pulse">loading map...</p>
      </main>
    );
  }

  return (
    <main className="h-screen w-full bg-t-dark relative">
      {/* Top bar */}
      <div className="absolute top-[72px] left-0 right-0 z-10 pointer-events-none">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-12 pt-3 sm:pt-4 flex items-start sm:items-center justify-between gap-2">
          <div className="pointer-events-auto bg-t-dark/90 backdrop-blur-sm border border-t-surface/20 px-3 sm:px-5 py-2 sm:py-3 shrink min-w-0">
            <div className="font-mono text-[0.5rem] sm:text-[0.6rem] text-t-surface/50 mb-0.5 sm:mb-1 truncate">
              <span className="text-t-accent">$</span> btcmap --locate
            </div>
            <h1 className="font-mono font-bold lowercase text-t-surface text-sm sm:text-lg tracking-tight">
              bitcoin map<span className="text-t-accent">.</span>
            </h1>
          </div>

          <button
            onClick={onClose}
            className="pointer-events-auto shrink-0 bg-t-accent/90 backdrop-blur-sm border border-t-accent text-t-surface px-3 sm:px-5 py-2 sm:py-2.5 font-mono text-[0.65rem] sm:text-[0.72rem] font-semibold hover:bg-t-surface hover:text-t-dark transition-all cursor-pointer flex items-center gap-2 sm:gap-3"
          >
            <span>list</span>
            <span className="bg-t-dark/20 px-1.5 sm:px-2 py-0.5 text-[0.55rem] sm:text-[0.6rem]">{places.length}</span>
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-t-dark/90 backdrop-blur-sm border border-t-surface/20 px-6 py-4">
          <p className="font-mono text-[0.8rem] text-t-surface/60 animate-pulse">
            loading bitcoin locations...
          </p>
        </div>
      )}

      {/* Map */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        options={{
          styles: mapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        {places.map((place, i) => (
          <Marker
            key={`${place.lat}-${place.lon}-${i}`}
            position={{ lat: place.lat, lng: place.lon }}
            title={place.name}
            onClick={() => handleMarkerClick(place)}
            icon={{
              url: "data:image/svg+xml," + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
                  <circle cx="14" cy="14" r="12" fill="#F7931A" stroke="#1a1a2e" stroke-width="2"/>
                  <text x="14" y="18" text-anchor="middle" font-size="14" font-weight="bold" fill="#1a1a2e" font-family="monospace">₿</text>
                </svg>
              `),
              scaledSize: typeof google !== "undefined" ? new google.maps.Size(28, 28) : undefined,
            }}
          />
        ))}
      </GoogleMap>

      {/* Sidebar drawer */}
      {drawerPlace && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40"
            onClick={() => setDrawerPlace(null)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-md bg-t-dark border-l border-t-surface/20 overflow-y-auto animate-slide-in">
            <div className="p-6 lg:p-8">
              <button
                onClick={() => setDrawerPlace(null)}
                className="font-mono text-[0.7rem] text-t-surface/50 hover:text-t-accent transition-colors cursor-pointer mb-6"
              >
                ← close
              </button>

              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-mono font-bold lowercase text-t-surface text-xl tracking-tight">
                  {drawerPlace.name}
                </h2>
                <span className="shrink-0 font-mono text-[0.55rem] px-2 py-0.5 border border-t-surface/20 text-t-surface/45">
                  {getCategory(drawerPlace.icon)}
                </span>
              </div>

              {drawerPlace.description && (
                <p className="font-sans text-[0.85rem] text-t-surface/70 leading-relaxed mb-6">
                  {drawerPlace.description}
                </p>
              )}

              {drawerPlace.verified_at && (
                <div className="flex items-center gap-2 mb-6">
                  <span className="font-mono text-[0.55rem] px-2 py-0.5 border border-green-500/30 text-green-400">
                    verified
                  </span>
                  <span className="font-mono text-[0.55rem] text-t-surface/35">
                    {new Date(drawerPlace.verified_at).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="space-y-5">
                {drawerPlace.address && (
                  <Field label="address" orange>
                    <p className="font-mono text-[0.8rem] text-t-surface">{drawerPlace.address}</p>
                  </Field>
                )}

                {drawerPlace.website && (
                  <Field label="website" orange>
                    <a href={drawerPlace.website} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-[0.8rem] text-t-accent hover:text-t-surface transition-colors break-all">
                      {drawerPlace.website}
                    </a>
                  </Field>
                )}

                {drawerPlace.phone && (
                  <Field label="phone" orange>
                    <p className="font-mono text-[0.8rem] text-t-surface">{drawerPlace.phone}</p>
                  </Field>
                )}

                {drawerPlace.email && (
                  <Field label="email" orange>
                    <a href={`mailto:${drawerPlace.email}`}
                      className="font-mono text-[0.8rem] text-t-accent hover:text-t-surface transition-colors">
                      {drawerPlace.email}
                    </a>
                  </Field>
                )}

                {drawerPlace.opening_hours && (
                  <Field label="hours">
                    <p className="font-mono text-[0.75rem] text-t-surface/60">{drawerPlace.opening_hours}</p>
                  </Field>
                )}

                {(drawerPlace.facebook || drawerPlace.instagram || drawerPlace.twitter) && (
                  <Field label="social">
                    <div className="flex gap-3">
                      {drawerPlace.facebook && (
                        <a href={drawerPlace.facebook} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-[0.7rem] text-t-surface/50 hover:text-t-accent transition-colors">facebook</a>
                      )}
                      {drawerPlace.instagram && (
                        <a href={drawerPlace.instagram} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-[0.7rem] text-t-surface/50 hover:text-t-accent transition-colors">instagram</a>
                      )}
                      {drawerPlace.twitter && (
                        <a href={drawerPlace.twitter} target="_blank" rel="noopener noreferrer"
                          className="font-mono text-[0.7rem] text-t-surface/50 hover:text-t-accent transition-colors">twitter</a>
                      )}
                    </div>
                  </Field>
                )}

                {drawerPlace.image && (
                  <Field label="photo" orange>
                    <img src={drawerPlace.image} alt={drawerPlace.name} className="max-w-full max-h-48 object-cover border border-t-surface/10" />
                  </Field>
                )}

                {drawerPlace.payment_provider && (
                  <Field label="payment" orange>
                    <p className="font-mono text-[0.8rem] text-t-surface">{drawerPlace.payment_provider}</p>
                  </Field>
                )}

                {drawerPlace.comments && (
                  <Field label="notes">
                    <p className="font-sans text-[0.8rem] text-t-surface/60 leading-relaxed">{drawerPlace.comments}</p>
                  </Field>
                )}

                <Field label="coordinates">
                  <p className="font-mono text-[0.75rem] text-t-surface/60">
                    {drawerPlace.lat.toFixed(6)}, {drawerPlace.lon.toFixed(6)}
                  </p>
                </Field>
              </div>

              <div className="mt-8">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(drawerPlace.name + (drawerPlace.address ? " " + drawerPlace.address : ""))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-mono text-[0.72rem] font-semibold lowercase tracking-[0.04em] bg-t-accent text-t-surface px-6 py-3 hover:bg-t-surface hover:text-t-dark transition-all duration-200 cursor-pointer"
                >
                  open in google maps →
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-t-surface/10">
                <p className="font-mono text-[0.6rem] text-t-surface/40">
                  data from{" "}
                  <a href="https://btcmap.org" target="_blank" rel="noopener noreferrer"
                    className="text-t-accent hover:text-t-surface transition-colors">
                    btcmap.org
                  </a>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function Field({ label, orange, children }: { label: string; orange?: boolean; children: React.ReactNode }) {
  return (
    <div className={`border-l-2 pl-4 ${orange ? "border-t-accent" : "border-t-surface/20"}`}>
      <p className="font-mono text-[0.6rem] text-t-surface/45 uppercase tracking-wider mb-1">{label}</p>
      {children}
    </div>
  );
}

export default memo(MapView);
