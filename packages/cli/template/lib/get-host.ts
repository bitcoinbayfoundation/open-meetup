type Environment = "production" | "staging" | "preview" | "development";

interface HostConfig {
  url: string;
  environment: Environment;
  isProduction: boolean;
  isStaging: boolean;
  isPreview: boolean;
  isLocal: boolean;
}

/**
 * Determines the host URL based on Vercel environment variables.
 *
 * Required env vars for custom domains:
 * - Production: NEXT_PUBLIC_SITE_URL (or SITE_URL)
 * - Staging: STAGING_URL (set this manually in Vercel project settings)
 *
 * Automatically provided by Vercel:
 * - VERCEL_URL: Current deployment domain (no protocol)
 * - VERCEL_ENV: 'production' | 'preview' | 'development'
 * - VERCEL_PROJECT_PRODUCTION_URL: Production domain (available in previews too)
 * - VERCEL_GIT_COMMIT_REF: Git branch name (useful for staging detection)
 */
export function getHost(): HostConfig {
  const vercelEnv = process.env.VERCEL_ENV;
  const vercelUrl = process.env.VERCEL_URL;
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const customProductionUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  const stagingUrl = process.env.STAGING_URL;
  const gitBranch = process.env.VERCEL_GIT_COMMIT_REF;

  const withProtocol = (domain: string): string => {
    if (domain.startsWith("http")) return domain;
    return `https://${domain}`;
  };

  // 1. Production (custom domain or vercel.app)
  if (vercelEnv === "production") {
    const url = customProductionUrl || productionUrl || vercelUrl;
    if (!url) throw new Error("Production host not found");

    return {
      url: withProtocol(url),
      environment: "production",
      isProduction: true,
      isStaging: false,
      isPreview: false,
      isLocal: false,
    };
  }

  // 2. Staging detection (explicit env var or branch-based)
  const isStagingBranch = gitBranch === "staging" || gitBranch === "release";

  if (vercelEnv === "preview" && (stagingUrl || isStagingBranch)) {
    const url = stagingUrl || vercelUrl;

    if (!url) {
      throw new Error(
        "Staging URL not found. Set STAGING_URL env var or ensure VERCEL_URL is available",
      );
    }

    return {
      url: withProtocol(url),
      environment: "staging",
      isProduction: false,
      isStaging: true,
      isPreview: false,
      isLocal: false,
    };
  }

  // 3. Preview (PRs, feature branches)
  if (vercelEnv === "preview" && vercelUrl) {
    return {
      url: withProtocol(vercelUrl),
      environment: "preview",
      isProduction: false,
      isStaging: false,
      isPreview: true,
      isLocal: false,
    };
  }

  // 4. Local development fallback
  const localFallback =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    url: localFallback,
    environment: "development",
    isProduction: false,
    isStaging: false,
    isPreview: false,
    isLocal: true,
  };
}

export function getBaseUrl(): string {
  return getHost().url;
}
