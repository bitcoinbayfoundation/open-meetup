import { useState, useEffect } from "react";
import type { BTCMapPlace } from "@/types/btcmap";

interface UseBTCMapOptions {
  lat: number;
  lon: number;
  radius_km: number;
}

export function useBTCMap({ lat, lon, radius_km }: UseBTCMapOptions) {
  const [places, setPlaces] = useState<BTCMapPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPlaces() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `https://api.btcmap.org/v4/places/search/?lat=${lat}&lon=${lon}&radius_km=${radius_km}`,
        );
        if (!res.ok) throw new Error(`Failed to fetch places: ${res.statusText}`);
        const data = await res.json();
        setPlaces(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setLoading(false);
      }
    }
    fetchPlaces();
  }, [lat, lon, radius_km]);

  return { places, loading, error };
}
