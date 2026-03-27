import fs from "node:fs";
import { scaffoldInputSchema, type ScaffoldInput } from "./schemas.js";
import { DEFAULTS } from "./defaults.js";
import { getStateAbbrev } from "./states.js";

export async function runAgent(configPath?: string): Promise<ScaffoldInput> {
  let raw: string;

  if (configPath) {
    raw = fs.readFileSync(configPath, "utf-8");
  } else {
    // Read from stdin
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    raw = Buffer.concat(chunks).toString("utf-8");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const err = { success: false, errors: ["Invalid JSON input"] };
    process.stderr.write(JSON.stringify(err) + "\n");
    process.exit(1);
  }

  const result = scaffoldInputSchema.safeParse(parsed);
  if (!result.success) {
    const errors = result.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`,
    );
    process.stderr.write(JSON.stringify({ success: false, errors }) + "\n");
    process.exit(1);
  }

  // Merge with defaults for optional fields
  return mergeWithDefaults(result.data);
}

function mergeWithDefaults(input: ScaffoldInput): ScaffoldInput {
  return {
    ...input,
    org: {
      ...DEFAULTS.org,
      ...input.org,
      shortName: input.org.shortName ?? input.org.name.split(" ").slice(0, 2).join(" "),
    },
    legal: { ...DEFAULTS.legal, ...input.legal },
    location: {
      ...DEFAULTS.location,
      ...input.location,
      stateAbbrev: input.location.stateAbbrev || getStateAbbrev(input.location.state),
      areaDescription: input.location.areaDescription ?? `${input.location.city} area`,
    },
    contact: input.contact,
    theme: {
      colors: { ...DEFAULTS.theme!.colors!, ...input.theme?.colors },
      fonts: { ...DEFAULTS.theme!.fonts!, ...input.theme?.fonts },
    },
    programs: input.programs ?? DEFAULTS.programs,
    donations: input.donations ?? DEFAULTS.donations,
  };
}
