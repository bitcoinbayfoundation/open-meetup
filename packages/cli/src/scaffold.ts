import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import type { ScaffoldInput } from "./schemas.js";
import { DEFAULTS } from "./defaults.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getTemplateDir(): string {
  const candidates = [
    path.resolve(__dirname, "..", "template"),          // published: dist/../template
    path.resolve(__dirname, "..", "..", "template"),     // dev from src/: src/../../template
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "package.json"))) {
      return candidate;
    }
  }
  throw new Error("Template directory not found. Searched: " + candidates.join(", "));
}

function merge<T extends Record<string, unknown>>(defaults: T, overrides: Partial<T>): T {
  const result = { ...defaults };
  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const val = overrides[key];
    if (val !== undefined && val !== null) {
      if (typeof val === "object" && !Array.isArray(val)) {
        result[key] = merge(
          (result[key] ?? {}) as Record<string, unknown>,
          val as Record<string, unknown>,
        ) as T[keyof T];
      } else {
        result[key] = val as T[keyof T];
      }
    }
  }
  return result;
}

function buildSiteConfig(input: ScaffoldInput, interfaceBlock?: string): string {
  const d = DEFAULTS;
  const url = input.url ?? `https://${input.contact.domain}`;
  const shortName = input.org.shortName ?? input.org.name.split(" ").slice(0, 2).join(" ");
  const areaDescription = input.location.areaDescription ?? `${input.location.city} area`;
  const appName = input.auth?.appName ?? shortName;
  const fromName = input.email?.fromName ?? shortName;
  const fromAddress = input.email?.fromAddress ?? `noreply@${input.contact.domain}`;
  const colors = merge(d.theme!.colors!, input.theme?.colors ?? {});
  const fonts = merge(d.theme!.fonts!, input.theme?.fonts ?? {});

  const typeBlock = interfaceBlock ?? "export interface SiteConfig { [key: string]: unknown; }";
  return `${typeBlock}

const config: SiteConfig = ${JSON.stringify(
    {
      org: {
        name: input.org.name,
        shortName,
        tagline: input.org.tagline ?? d.org.tagline,
        mission: input.org.mission ?? d.org.mission,
        description: input.org.description ?? d.org.description,
        foundedDate: input.org.foundedDate ?? d.org.foundedDate,
        ...(input.org.founderHandle ? { founderHandle: input.org.founderHandle } : {}),
      },
      legal: {
        ein: input.legal.ein,
        ...(input.legal.stateRegistration ? { stateRegistration: input.legal.stateRegistration } : {}),
        nonprofitStatus: input.legal.nonprofitStatus ?? "501(c)(3)",
      },
      location: {
        city: input.location.city,
        state: input.location.state,
        stateAbbrev: input.location.stateAbbrev,
        streetAddress: input.location.streetAddress ?? "",
        locality: input.location.locality ?? "",
        postalCode: input.location.postalCode ?? "",
        country: input.location.country ?? "US",
        areaDescription,
        ...(input.location.mapCenter ? { mapCenter: input.location.mapCenter } : {}),
      },
      contact: {
        email: input.contact.email,
        domain: input.contact.domain,
      },
      url,
      socials: input.socials ?? {},
      auth: {
        allowedEmails: input.auth?.allowedEmails ?? [input.contact.email],
        appName,
      },
      ...(input.meetup ? { meetup: input.meetup } : {}),
      ...(input.notifications ? { notifications: input.notifications } : { notifications: { provider: "telegram" } }),
      email: {
        fromName,
        fromAddress,
      },
      theme: { colors, fonts },
      programs: input.programs ?? d.programs ?? [],
      donations: input.donations ?? { enabled: false },
      nav: {
        links: ["about", "events", "posts", "education", "donate", "contact"],
      },
      footer: {
        tagline: "don't trust. verify.",
      },
      seo: {
        keywords: [
          "bitcoin",
          input.location.city.toLowerCase(),
          "meetup",
          "blockchain",
          "education",
          "nonprofit",
          "community",
        ],
      },
    },
    null,
    2,
  )};

export default config;
`;
}

function buildAboutMd(): string {
  // Empty — the about page will show a "content needed" placeholder
  return "";
}

function buildFaqs(): object {
  // Empty arrays — FAQ sections will be hidden until content is added
  return {
    home: [],
    about: [],
    donate: [],
    education: [],
  };
}

function buildDonationTiers(): object[] {
  // Empty — donation tiers section will be hidden until configured
  return [];
}

export interface ScaffoldSteps {
  geocodeCity: () => Promise<void>;
  copyTemplate: () => Promise<void>;
  writeConfig: () => Promise<void>;
  writeContent: () => Promise<void>;
  copyAssets: () => Promise<void>;
  createEnv: () => Promise<void>;
  configurePackage: () => Promise<void>;
  initGit: () => Promise<void>;
}

async function geocode(city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${city}, ${state}`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { "User-Agent": "open-meetup-cli/1.0" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function scaffold(input: ScaffoldInput): Promise<{ targetDir: string; steps: ScaffoldSteps }> {
  const templateDir = getTemplateDir();
  const dirName = input.directory ?? `./${input.org.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  const targetDir = path.resolve(process.cwd(), dirName);

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    throw new Error(`Directory ${targetDir} already exists and is not empty`);
  }

  const steps: ScaffoldSteps = {
    async geocodeCity() {
      if (!input.location.mapCenter) {
        const coords = await geocode(input.location.city, input.location.state);
        if (coords) {
          input.location.mapCenter = coords;
        }
      }
    },

    async copyTemplate() {
      await fs.copy(templateDir, targetDir, {
        filter: (src: string) => {
          const rel = path.relative(templateDir, src);
          if (rel.startsWith("node_modules")) return false;
          if (rel.startsWith(".next")) return false;
          if (rel === ".env" || rel === ".env.local") return false;
          if (rel === "tsconfig.tsbuildinfo") return false;
          return true;
        },
      });
    },

    async writeConfig() {
      const existingConfig = await fs.readFile(path.join(targetDir, "site.config.ts"), "utf-8");
      const interfaceBlock = existingConfig.split("\nconst config:")[0];
      await fs.writeFile(path.join(targetDir, "site.config.ts"), buildSiteConfig(input, interfaceBlock));
    },

    async writeContent() {
      await fs.ensureDir(path.join(targetDir, "content"));
      await fs.writeFile(path.join(targetDir, "content", "about.md"), buildAboutMd());
      await fs.writeFile(path.join(targetDir, "content", "faqs.json"), JSON.stringify(buildFaqs(), null, 2) + "\n");
      await fs.writeFile(path.join(targetDir, "content", "donation-tiers.json"), JSON.stringify(buildDonationTiers(), null, 2) + "\n");
    },

    async copyAssets() {
      const brandDir = path.join(targetDir, "public", "brand");
      await fs.ensureDir(brandDir);
      if (input.logo && fs.existsSync(input.logo)) {
        const ext = path.extname(input.logo) || ".png";
        await fs.copy(input.logo, path.join(brandDir, `logo${ext}`));
      }
      if (input.favicon && fs.existsSync(input.favicon)) {
        await fs.copy(input.favicon, path.join(targetDir, "public", "favicon.ico"));
      }
      if (input.ogImage && fs.existsSync(input.ogImage)) {
        await fs.ensureDir(path.join(targetDir, "public", "og"));
        await fs.copy(input.ogImage, path.join(targetDir, "public", "og", "default.png"));
      }
    },

    async createEnv() {
      const envExample = path.join(targetDir, ".env.example");
      if (fs.existsSync(envExample)) {
        await fs.copy(envExample, path.join(targetDir, ".env"));
      }
    },

    async configurePackage() {
      const pkgPath = path.join(targetDir, "package.json");
      const pkg = await fs.readJson(pkgPath);
      pkg.name = input.org.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    },

    async initGit() {
      try {
        execSync("git init && git add -A && git commit -m 'Initial scaffold from open-meetup'", {
          cwd: targetDir,
          stdio: "pipe",
        });
      } catch {
        // Git init failed — not critical
      }
    },
  };

  return { targetDir, steps };
}
