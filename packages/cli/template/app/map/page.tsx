import { genMetadata } from "@/lib/og";
import config from "@/site.config";
import BitcoinMap from "./bitcoin-map";

export const metadata = genMetadata({
  path: "/map",
  title: `Bitcoin Merchants & ATMs in ${config.location.city} — ${config.org.name}`,
  image: "/og/map.png",
  description:
    `Find Bitcoin-accepting businesses, merchants, and ATMs in ${config.location.city}, ${config.location.state}. Explore the growing circular economy of Bitcoin-friendly locations across the ${config.location.areaDescription}.`,
});

export default function MapPage() {
  return (
    <BitcoinMap
      city={config.location.city}
      areaDescription={config.location.areaDescription}
      mapCenter={config.location.mapCenter}
    />
  );
}
