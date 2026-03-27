import * as p from "@clack/prompts";
import pc from "picocolors";
import type { ScaffoldInput } from "./schemas.js";
import { DEFAULTS } from "./defaults.js";
import { getStateAbbrev } from "./states.js";
import { AVAILABLE_PROGRAMS, DEFAULT_PROGRAMS, type Program } from "./programs.js";

export async function runInteractive(dirArg?: string): Promise<ScaffoldInput> {
  p.intro(pc.bold(pc.yellow("open-meetup") + " — Bitcoin Meetup Template"));

  const org = await p.group({
    name: () =>
      p.text({
        message: "Organization name",
        placeholder: DEFAULTS.org.name,
        validate: (v) => (v.length < 1 ? "Required" : undefined),
      }),
    shortName: ({ results }) =>
      p.text({
        message: "Short name (used in nav/logo)",
        placeholder: results.name?.split(" ").slice(0, 2).join(" "),
      }),
    tagline: () =>
      p.text({
        message: "Tagline",
        placeholder: DEFAULTS.org.tagline,
      }),
  });

  if (p.isCancel(org)) { p.outro(pc.dim("Goodbye!")); process.exit(0); }

  const location = await p.group({
    city: () =>
      p.text({ message: "City", placeholder: "Tampa Bay", validate: (v) => (v.length < 1 ? "Required" : undefined) }),
    state: () =>
      p.text({ message: "State", placeholder: "Florida", validate: (v) => (v.length < 1 ? "Required" : undefined) }),
    streetAddress: () => p.text({ message: "Street address (optional)", placeholder: "1101 Fourth St S" }),
    locality: () => p.text({ message: "City/locality for address (optional)", placeholder: "Saint Petersburg" }),
    postalCode: () => p.text({ message: "Postal code (optional)", placeholder: "33701" }),
  });

  if (p.isCancel(location)) { p.outro(pc.dim("Goodbye!")); process.exit(0); }

  const contact = await p.group({
    email: () =>
      p.text({ message: "Contact email", placeholder: "hello@example.com", validate: (v) => (v.includes("@") ? undefined : "Must be a valid email") }),
    domain: () =>
      p.text({ message: "Website domain", placeholder: "example.com", validate: (v) => (v.length < 1 ? "Required" : undefined) }),
  });

  if (p.isCancel(contact)) { p.outro(pc.dim("Goodbye!")); process.exit(0); }

  const adminEmail = await p.text({
    message: "Your admin email (for signing into the dashboard)",
    placeholder: contact.email as string,
    initialValue: contact.email as string,
    validate: (v) => (v.includes("@") ? undefined : "Must be a valid email"),
  });

  if (p.isCancel(adminEmail)) { p.outro(pc.dim("Goodbye!")); process.exit(0); }

  const legal = await p.group({
    ein: () =>
      p.text({ message: "EIN", placeholder: "XX-XXXXXXX", validate: (v) => (v.length < 1 ? "Required" : undefined) }),
    foundedDate: () =>
      p.text({ message: "Founded date (YYYY-MM)", placeholder: "2024-01" }),
  });

  if (p.isCancel(legal)) { p.outro(pc.dim("Goodbye!")); process.exit(0); }

  const socials = await p.group({
    x: () => p.text({ message: "X/Twitter URL (optional)", placeholder: "https://x.com/..." }),
    youtube: () => p.text({ message: "YouTube URL (optional)", placeholder: "https://youtube.com/..." }),
    instagram: () => p.text({ message: "Instagram URL (optional)", placeholder: "https://instagram.com/..." }),
  });

  if (p.isCancel(socials)) { p.outro(pc.dim("Goodbye!")); process.exit(0); }

  const extras = await p.group({
    meetupSlug: () => p.text({ message: "Meetup.com group slug (optional)", placeholder: "your-bitcoin-meetup" }),
    logo: () => p.text({ message: "Path to logo file (optional)", placeholder: "~/Downloads/logo.png" }),
    favicon: () => p.text({ message: "Path to favicon file (optional)", placeholder: "~/Downloads/favicon.ico" }),
  });

  if (p.isCancel(extras)) { p.outro(pc.dim("Goodbye!")); process.exit(0); }

  // Notifications
  const notifProvider = await p.select({
    message: "Notification provider (for contact form & payment alerts)",
    options: [
      { value: "telegram", label: "Telegram", hint: "recommended — set up a bot via @BotFather" },
      { value: "slack", label: "Slack", hint: "requires a Slack bot token" },
    ],
    initialValue: "telegram",
  });

  if (p.isCancel(notifProvider)) { p.outro(pc.dim("Goodbye!")); process.exit(0); }

  // Programs
  const selectedPrograms = await p.multiselect({
    message: "What does your meetup do? (space to toggle, enter to confirm)",
    options: AVAILABLE_PROGRAMS.map((prog) => ({
      value: prog.name,
      label: prog.name,
      hint: prog.description.slice(0, 60) + (prog.description.length > 60 ? "..." : ""),
    })),
    initialValues: DEFAULT_PROGRAMS.map((p) => p.name),
    required: false,
  });

  if (p.isCancel(selectedPrograms)) { p.outro(pc.dim("Goodbye!")); process.exit(0); }

  const programs: Program[] = (selectedPrograms as string[]).map((name) => {
    const found = AVAILABLE_PROGRAMS.find((p) => p.name === name);
    return found ?? { name, description: "" };
  });

  // Theme colors
  const customizeColors = await p.confirm({
    message: "Customize theme colors? (no = use defaults)",
    initialValue: false,
  });

  if (p.isCancel(customizeColors)) { p.outro(pc.dim("Goodbye!")); process.exit(0); }

  let themeColors: Record<string, string> | undefined;

  if (customizeColors) {
    const colors = await p.group({
      dark: () => p.text({ message: "Dark background", placeholder: "#111111", initialValue: "#111111" }),
      darkAlt: () => p.text({ message: "Dark alt (cards)", placeholder: "#1A1A1A", initialValue: "#1A1A1A" }),
      primary: () => p.text({ message: "Primary", placeholder: "#2A2A2A", initialValue: "#2A2A2A" }),
      accent: () => p.text({ message: "Accent (buttons, links)", placeholder: "#F7931A", initialValue: "#F7931A" }),
      accentAlt: () => p.text({ message: "Accent alt (errors)", placeholder: "#D4483B", initialValue: "#D4483B" }),
      highlight: () => p.text({ message: "Highlight", placeholder: "#3B82F6", initialValue: "#3B82F6" }),
      warm: () => p.text({ message: "Warm", placeholder: "#FBBF24", initialValue: "#FBBF24" }),
      surface: () => p.text({ message: "Surface (text)", placeholder: "#E5E5E5", initialValue: "#E5E5E5" }),
    });

    if (p.isCancel(colors)) { p.outro(pc.dim("Goodbye!")); process.exit(0); }

    themeColors = {
      dark: colors.dark as string,
      darkAlt: colors.darkAlt as string,
      primary: colors.primary as string,
      accent: colors.accent as string,
      accentAlt: colors.accentAlt as string,
      highlight: colors.highlight as string,
      warm: colors.warm as string,
      surface: colors.surface as string,
      white: "#FFFFFF",
    };
  }

  const dirDefault = dirArg ?? `./${(org.name as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  const directory = await p.text({
    message: "Target directory",
    placeholder: dirDefault,
    initialValue: dirDefault,
  });

  if (p.isCancel(directory)) { p.outro(pc.dim("Goodbye!")); process.exit(0); }

  return {
    org: {
      name: org.name as string,
      shortName: (org.shortName as string) || undefined,
      tagline: (org.tagline as string) || undefined,
      foundedDate: (legal.foundedDate as string) || undefined,
    },
    legal: {
      ein: legal.ein as string,
      nonprofitStatus: "501(c)(3)",
    },
    location: {
      city: location.city as string,
      state: location.state as string,
      stateAbbrev: getStateAbbrev(location.state as string),
      streetAddress: (location.streetAddress as string) || "",
      locality: (location.locality as string) || "",
      postalCode: (location.postalCode as string) || "",
      country: "US",
    },
    contact: {
      email: contact.email as string,
      domain: contact.domain as string,
    },
    socials: {
      x: (socials.x as string) || undefined,
      youtube: (socials.youtube as string) || undefined,
      instagram: (socials.instagram as string) || undefined,
    },
    auth: { allowedEmails: [adminEmail as string] },
    ...(extras.meetupSlug ? { meetup: { groupSlug: extras.meetupSlug as string } } : {}),
    notifications: { provider: notifProvider as "telegram" | "slack" },
    programs: programs.length > 0 ? programs : undefined,
    theme: themeColors ? { colors: themeColors } : undefined,
    logo: (extras.logo as string) || undefined,
    favicon: (extras.favicon as string) || undefined,
    directory: directory as string,
  };
}
