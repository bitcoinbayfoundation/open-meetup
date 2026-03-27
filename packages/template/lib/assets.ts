import manifest from "./asset-manifest.json";

const assetMap = manifest as Record<string, string>;

export function asset(path: string): string {
  return assetMap[path] || path;
}
