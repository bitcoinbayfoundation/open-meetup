#!/usr/bin/env node

import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import pc from "picocolors";
import * as p from "@clack/prompts";
import { scaffold } from "./scaffold.js";
import { runAgent } from "./agent.js";
import { runInteractive } from "./interactive.js";
import { DEFAULTS } from "./defaults.js";

// Handle Ctrl+C gracefully everywhere
process.on("SIGINT", () => {
  p.outro(pc.dim("Goodbye!"));
  process.exit(0);
});

function commandExists(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

async function checkDependencies(interactive: boolean): Promise<void> {
  const missing: Array<{ name: string; install: string; required: boolean }> = [];

  if (!commandExists("pnpm")) {
    missing.push({ name: "pnpm", install: "npm install -g pnpm", required: true });
  }

  if (!commandExists("vercel")) {
    missing.push({ name: "Vercel CLI", install: "npm install -g vercel", required: false });
  }

  if (missing.length === 0) return;

  if (!interactive) {
    // Agent/yes mode: warn but don't block
    for (const dep of missing) {
      process.stderr.write(`Warning: ${dep.name} not found. Install with: ${dep.install}\n`);
    }
    return;
  }

  // Interactive mode: ask to install
  for (const dep of missing) {
    const label = dep.required ? `${dep.name} (required)` : `${dep.name} (optional, for deployment)`;
    const install = await p.confirm({
      message: `${label} is not installed. Install it now?`,
      initialValue: dep.required,
    });

    if (p.isCancel(install)) process.exit(0);

    if (install) {
      const spin = p.spinner();
      spin.start(`Installing ${dep.name}...`);
      try {
        execSync(dep.install, { stdio: "pipe" });
        spin.stop(`${dep.name} installed`);
      } catch {
        spin.stop(`Failed to install ${dep.name}`);
        if (dep.required) {
          p.log.error(`${dep.name} is required. Install manually: ${pc.cyan(dep.install)}`);
          process.exit(1);
        } else {
          p.log.warn(`Skipping ${dep.name}. Install later: ${pc.cyan(dep.install)}`);
        }
      }
    } else if (dep.required) {
      p.log.error(`${dep.name} is required. Install with: ${pc.cyan(dep.install)}`);
      process.exit(1);
    }
  }
}

const { values, positionals } = parseArgs({
  options: {
    yes: { type: "boolean", short: "y", default: false },
    agent: { type: "boolean", default: false },
    config: { type: "string", short: "c" },
    name: { type: "string" },
    directory: { type: "string", short: "d" },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: true,
  strict: false,
});

async function main() {
  if (values.help) {
    console.log(`
${pc.bold(pc.yellow("open-meetup"))} — Scaffold a Bitcoin meetup nonprofit website

${pc.bold("Usage:")}
  npx @bitcoinbay/open-meetup [directory] [options]

${pc.bold("Options:")}
  -y, --yes         Use defaults (skip interactive prompts)
  --agent           Agent mode: read JSON config from stdin or --config
  -c, --config      Path to JSON config file (use with --agent)
  --name            Override organization name
  -d, --directory   Target directory
  -h, --help        Show this help message

${pc.bold("Modes:")}
  Interactive (default)   Guided setup with prompts
  --yes                   Quick scaffold with defaults
  --agent                 Structured JSON input for AI agents

${pc.bold("Examples:")}
  npx @bitcoinbay/open-meetup my-meetup
  npx @bitcoinbay/open-meetup --yes --name "Tampa Bitcoiners"
  echo '{"org":{"name":"ATX Bitcoin"},...}' | npx @bitcoinbay/open-meetup --agent
  npx @bitcoinbay/open-meetup --agent --config config.json
`);
    process.exit(0);
  }

  const dirArg = positionals[0] ?? values.directory;

  try {
    let targetDir: string;

    // Check dependencies before proceeding
    await checkDependencies(!values.agent && !values.yes);

    if (values.agent) {
      // Agent mode: no UI, structured JSON output
      const config = await runAgent(values.config as string | undefined);
      if (dirArg) config.directory = dirArg;
      const { targetDir: dir, steps } = await scaffold(config);
      await steps.geocodeCity();
      await steps.copyTemplate();
      await steps.writeConfig();
      await steps.writeContent();
      await steps.copyAssets();
      await steps.createEnv();
      await steps.configurePackage();
      await steps.initGit();
      targetDir = dir;
      process.stdout.write(JSON.stringify({ success: true, directory: targetDir }) + "\n");
    } else if (values.yes) {
      const config = {
        ...DEFAULTS,
        ...(values.name ? { org: { ...DEFAULTS.org, name: values.name as string } } : {}),
        ...(dirArg ? { directory: dirArg } : {}),
      };
      targetDir = await scaffoldWithTasks(config);
      p.outro(`${pc.green("Done!")} Project scaffolded in ${pc.bold(targetDir)}`);
      printNextSteps(targetDir);
    } else {
      const config = await runInteractive(dirArg);
      targetDir = await scaffoldWithTasks(config);
      p.outro(`${pc.green("Done!")} Project scaffolded in ${pc.bold(targetDir)}`);
      printNextSteps(targetDir);
    }
  } catch (err) {
    if (values.agent) {
      process.stderr.write(
        JSON.stringify({ success: false, errors: [(err as Error).message] }) + "\n",
      );
      process.exit(1);
    }
    console.error(`\n${pc.red("Error:")} ${(err as Error).message}\n`);
    process.exit(1);
  }
}

async function scaffoldWithTasks(config: Parameters<typeof scaffold>[0]): Promise<string> {
  const { targetDir, steps } = await scaffold(config);

  await p.tasks([
    { title: "Setting up BTCMap.org", task: async () => { await steps.geocodeCity(); } },
    { title: "Copying template files", task: async () => { await steps.copyTemplate(); } },
    { title: "Writing site config", task: async () => { await steps.writeConfig(); } },
    { title: "Generating content files", task: async () => { await steps.writeContent(); } },
    { title: "Setting up brand assets", task: async () => { await steps.copyAssets(); } },
    { title: "Creating .env file", task: async () => { await steps.createEnv(); } },
    { title: "Configuring package.json", task: async () => { await steps.configurePackage(); } },
    { title: "Initializing git repository", task: async () => { await steps.initGit(); } },
  ]);

  return targetDir;
}

function printNextSteps(dir: string) {
  const rel = dir.startsWith("/") ? dir : `./${dir}`;
  console.log(pc.bold("Next steps:"));
  console.log(`  ${pc.dim("1.")} cd ${rel}`);
  console.log(`  ${pc.dim("2.")} ${pc.cyan("pnpm install")}`);
  console.log(`  ${pc.dim("3.")} Edit ${pc.yellow(".env")} with your API keys`);
  console.log(`  ${pc.dim("4.")} ${pc.cyan("pnpm dev")} to preview`);
  console.log(`  ${pc.dim("5.")} Deploy to Vercel\n`);
}

main();
