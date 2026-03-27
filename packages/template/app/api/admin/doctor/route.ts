import { NextResponse } from "next/server";
import { createHash } from "crypto";
import config from "@/site.config";
import fs from "fs";
import path from "path";

// SHA-256 hashes of placeholder assets shipped with the template
const PLACEHOLDER_HASHES = {
  logo: "10d66e3c0ebe66f1573c25b9ba1f66893dc0e7bb5957b718b410998bcbed812c",
  favicon: "8c31dff16307b4092aac96481ec57a99cca584ab4bf3611c8f09f1ca97af739d",
};

function fileHash(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

interface Check {
  name: string;
  status: "ok" | "warning" | "error";
  description: string;
  docLink?: string;
  detail?: string;
}

// TODO: Re-enable auth once setup is complete
// import { requireAdmin } from "@/lib/require-admin";

export async function GET() {

  const checks: Check[] = [];

  // ── Environment Variables ──────────────────────────────────

  const hasDb = !!process.env.POSTGRES_URL;
  checks.push({
    name: "Database",
    status: hasDb ? "ok" : "error",
    description: "PostgreSQL connection string. Vercel Postgres sets POSTGRES_URL automatically. Set it in .env for local development.",
    detail: hasDb ? "POSTGRES_URL is configured" : "POSTGRES_URL is not set in .env",
    docLink: "/docs?tab=vercel",
  });

  const envChecks: Array<{
    key: string;
    name: string;
    description: string;
    required: boolean;
    docLink: string;
  }> = [
    {
      key: "BETTER_AUTH_SECRET",
      name: "Auth Secret",
      description: "Secret key for signing auth sessions and tokens. Required for admin login.",
      required: true,
      docLink: "/docs?tab=getting-started",
    },
    {
      key: "RESEND_API_KEY",
      name: "Resend API Key",
      description: "Enables email verification, password resets, and newsletter subscriptions via Resend.",
      required: false,
      docLink: "/docs?tab=resend",
    },
    {
      key: "RESEND_AUDIENCE_ID",
      name: "Resend Audience ID",
      description: "Newsletter audience ID in Resend. Required for newsletter subscriptions to work.",
      required: false,
      docLink: "/docs?tab=resend",
    },
    {
      key: "ZAPRITE_API_KEY",
      name: "Zaprite API Key",
      description: "Enables Bitcoin/Lightning donation checkout via Zaprite.",
      required: false,
      docLink: "/docs?tab=zaprite",
    },
    {
      key: "MEETUP_CLIENT_ID",
      name: "Meetup Client ID",
      description: "OAuth client ID for Meetup.com event sync.",
      required: false,
      docLink: "/docs?tab=meetup",
    },
    {
      key: "MEETUP_CLIENT_SECRET",
      name: "Meetup Client Secret",
      description: "OAuth client secret for Meetup.com event sync.",
      required: false,
      docLink: "/docs?tab=meetup",
    },
    {
      key: "MEETUP_OAUTH_TOKEN",
      name: "Meetup OAuth Token",
      description: "Access token for Meetup.com API. Used with refresh token for event sync.",
      required: false,
      docLink: "/docs?tab=meetup",
    },
    {
      key: "MEETUP_OAUTH_REFRESH_TOKEN",
      name: "Meetup Refresh Token",
      description: "Refresh token for Meetup.com API. Needed to renew access tokens automatically.",
      required: false,
      docLink: "/docs?tab=meetup",
    },
    {
      key: "TELEGRAM_BOT_TOKEN",
      name: "Telegram Bot Token",
      description: "Enables contact form and payment notifications via Telegram bot. Create one with @BotFather.",
      required: false,
      docLink: "/docs?tab=telegram",
    },
    {
      key: "TELEGRAM_CHAT_ID",
      name: "Telegram Chat ID",
      description: "The Telegram group or channel ID to send notifications to.",
      required: false,
      docLink: "/docs?tab=telegram",
    },
    {
      key: "SLACK_BOT_TOKEN",
      name: "Slack Bot Token",
      description: "Alternative to Telegram. Enables notifications to a Slack channel.",
      required: false,
      docLink: "/docs?tab=telegram",
    },
    {
      key: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
      name: "Google Maps API Key",
      description: "Enables the interactive Google Maps view on the Bitcoin merchant map page.",
      required: false,
      docLink: "/docs?tab=google-maps",
    },
    {
      key: "BLOB_READ_WRITE_TOKEN",
      name: "Vercel Blob Token",
      description: "Enables image and file uploads in the admin media panel via Vercel Blob storage.",
      required: false,
      docLink: "/docs?tab=vercel",
    },
  ];

  for (const env of envChecks) {
    const isSet = !!process.env[env.key];
    checks.push({
      name: env.name,
      status: isSet ? "ok" : env.required ? "error" : "warning",
      description: env.description,
      detail: isSet ? `${env.key} is configured` : `${env.key} is not set in .env`,
      ...(!isSet ? { docLink: env.docLink } : {}),
    });
  }

  // ── Integration Groups ─────────────────────────────────────

  const meetupVars = ["MEETUP_CLIENT_ID", "MEETUP_CLIENT_SECRET"];
  const meetupPartial = meetupVars.some((k) => !!process.env[k]) && !meetupVars.every((k) => !!process.env[k]);
  if (meetupPartial) {
    checks.push({
      name: "Meetup Partial Config",
      status: "warning",
      description: "Some Meetup.com variables are set but not all. Event sync requires MEETUP_CLIENT_ID, MEETUP_CLIENT_SECRET, and either MEETUP_OAUTH_TOKEN or MEETUP_OAUTH_REFRESH_TOKEN.",
      docLink: "/docs?tab=meetup",
    });
  }

  const resendVars = ["RESEND_API_KEY", "RESEND_AUDIENCE_ID"];
  const resendPartial = resendVars.some((k) => !!process.env[k]) && !resendVars.every((k) => !!process.env[k]);
  if (resendPartial) {
    checks.push({
      name: "Resend Partial Config",
      status: "warning",
      description: "RESEND_API_KEY is set but RESEND_AUDIENCE_ID is missing (or vice versa). Both are needed for newsletter subscriptions.",
      docLink: "/docs?tab=resend",
    });
  }

  // ── Content Files ──────────────────────────────────────────

  const contentDir = process.cwd();

  const aboutPath = path.join(contentDir, "content/about.md");
  const aboutExists = fs.existsSync(aboutPath);
  const aboutContent = aboutExists ? fs.readFileSync(aboutPath, "utf-8").trim() : "";
  checks.push({
    name: "About Page Content",
    status: aboutContent.length > 0 ? "ok" : "warning",
    description: "The about page story. Edit content/about.md to add your organization's story.",
    detail: aboutContent.length > 0 ? `${aboutContent.split("\n\n").length} paragraphs` : "content/about.md is empty",
    ...(aboutContent.length === 0 ? { docLink: "/docs?tab=content-guide" } : {}),
  });

  const faqsPath = path.join(contentDir, "content/faqs.json");
  const faqsExists = fs.existsSync(faqsPath);
  let faqCount = 0;
  if (faqsExists) {
    try {
      const faqs = JSON.parse(fs.readFileSync(faqsPath, "utf-8"));
      faqCount = Object.values(faqs).flat().length;
    } catch { /* invalid json */ }
  }
  checks.push({
    name: "FAQ Content",
    status: faqCount > 0 ? "ok" : "warning",
    description: "FAQs displayed on home, about, donate, and education pages. Edit content/faqs.json.",
    detail: faqCount > 0 ? `${faqCount} FAQs across all pages` : "content/faqs.json has no FAQs",
    ...(faqCount === 0 ? { docLink: "/docs?tab=content-guide" } : {}),
  });

  const tiersPath = path.join(contentDir, "content/donation-tiers.json");
  const tiersExists = fs.existsSync(tiersPath);
  let tierCount = 0;
  if (tiersExists) {
    try {
      const tiers = JSON.parse(fs.readFileSync(tiersPath, "utf-8"));
      tierCount = Array.isArray(tiers) ? tiers.length : 0;
    } catch { /* invalid json */ }
  }
  checks.push({
    name: "Donation Tiers",
    status: tierCount > 0 ? "ok" : "warning",
    description: "Recurring donation membership tiers on the donate page. Edit content/donation-tiers.json.",
    detail: tierCount > 0 ? `${tierCount} tiers configured` : "content/donation-tiers.json is empty",
    ...(tierCount === 0 ? { docLink: "/docs?tab=content-guide" } : {}),
  });

  // ── Brand Assets ───────────────────────────────────────────

  const logoSvgPath = path.join(contentDir, "public/brand/logo.svg");
  const logoPngPath = path.join(contentDir, "public/brand/logo.png");
  const logoHash = fileHash(logoSvgPath) ?? fileHash(logoPngPath);
  const hasLogo = logoHash !== null;
  const isPlaceholderLogo = logoHash === PLACEHOLDER_HASHES.logo;
  checks.push({
    name: "Logo",
    status: !hasLogo ? "error" : isPlaceholderLogo ? "warning" : "ok",
    description: "Organization logo displayed in nav and footer. Replace public/brand/logo.svg with your own.",
    detail: !hasLogo
      ? "No logo found in public/brand/"
      : isPlaceholderLogo
        ? "Still using the default placeholder logo"
        : "Custom logo detected",
    ...(!hasLogo || isPlaceholderLogo ? { docLink: "/docs?tab=customization" } : {}),
  });

  const faviconSvgPath = path.join(contentDir, "public/favicon.svg");
  const faviconIcoPath = path.join(contentDir, "public/favicon.ico");
  const faviconHash = fileHash(faviconSvgPath) ?? fileHash(faviconIcoPath);
  const hasFavicon = faviconHash !== null;
  const isPlaceholderFavicon = faviconHash === PLACEHOLDER_HASHES.favicon;
  checks.push({
    name: "Favicon",
    status: !hasFavicon ? "error" : isPlaceholderFavicon ? "warning" : "ok",
    description: "Browser tab icon. Replace public/favicon.svg with your own.",
    detail: !hasFavicon
      ? "No favicon found in public/"
      : isPlaceholderFavicon
        ? "Still using the default placeholder favicon"
        : "Custom favicon detected",
    ...(!hasFavicon || isPlaceholderFavicon ? { docLink: "/docs?tab=customization" } : {}),
  });

  // ── Site Config Defaults ───────────────────────────────────

  const defaults: Array<{ path: string; label: string; value: string; defaultValues: string[] }> = [
    { path: "org.name", label: "Organization Name", value: config.org.name, defaultValues: ["My Bitcoin Meetup"] },
    { path: "org.shortName", label: "Short Name", value: config.org.shortName, defaultValues: ["BTC Meetup"] },
    { path: "org.tagline", label: "Tagline", value: config.org.tagline, defaultValues: ["Your city's Bitcoin community"] },
    { path: "legal.ein", label: "EIN", value: config.legal.ein, defaultValues: ["XX-XXXXXXX"] },
    { path: "location.city", label: "City", value: config.location.city, defaultValues: ["Your City"] },
    { path: "location.state", label: "State", value: config.location.state, defaultValues: ["Your State"] },
    { path: "contact.email", label: "Contact Email", value: config.contact.email, defaultValues: ["hello@example.com"] },
    { path: "contact.domain", label: "Domain", value: config.contact.domain, defaultValues: ["example.com"] },
    { path: "url", label: "Site URL", value: config.url, defaultValues: ["https://example.com"] },
  ];

  for (const d of defaults) {
    const isDefault = d.defaultValues.includes(d.value);
    checks.push({
      name: d.label,
      status: isDefault ? "warning" : "ok",
      description: `site.config.ts → ${d.path}`,
      detail: isDefault ? `Still using default value "${d.value}"` : d.value,
      ...(isDefault ? { docLink: "/docs?tab=config-reference" } : {}),
    });
  }

  // Programs check
  const defaultProgramNames = ["community meetups", "education & workshops"];
  const currentProgramNames = config.programs.map((p) => p.name);
  const isDefaultPrograms =
    currentProgramNames.length === defaultProgramNames.length &&
    currentProgramNames.every((n) => defaultProgramNames.includes(n));
  checks.push({
    name: "Programs",
    status: isDefaultPrograms ? "warning" : "ok",
    description: "site.config.ts → programs — what your meetup does (shown on homepage)",
    detail: isDefaultPrograms
      ? `Still using defaults: ${defaultProgramNames.join(", ")}`
      : `${config.programs.length} programs: ${currentProgramNames.join(", ")}`,
    ...(isDefaultPrograms ? { docLink: "/docs?tab=customization" } : {}),
  });

  // ── Summary ────────────────────────────────────────────────

  const errors = checks.filter((c) => c.status === "error").length;
  const warnings = checks.filter((c) => c.status === "warning").length;
  const ok = checks.filter((c) => c.status === "ok").length;

  return NextResponse.json({
    summary: { total: checks.length, ok, warnings, errors },
    checks,
  });
}
