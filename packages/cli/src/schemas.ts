import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #E76915");

export const scaffoldInputSchema = z.object({
  org: z.object({
    name: z.string().min(1),
    shortName: z.string().optional(),
    tagline: z.string().optional(),
    mission: z.string().optional(),
    description: z.string().optional(),
    foundedDate: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM").optional(),
    founderHandle: z.string().optional(),
  }),
  legal: z.object({
    ein: z.string().min(1),
    stateRegistration: z.string().optional(),
    nonprofitStatus: z.string().default("501(c)(3)"),
  }),
  location: z.object({
    city: z.string().min(1),
    state: z.string().min(1),
    stateAbbrev: z.string().max(3).optional().default(""),
    streetAddress: z.string().optional().default(""),
    locality: z.string().optional().default(""),
    postalCode: z.string().optional().default(""),
    country: z.string().default("US"),
    areaDescription: z.string().optional(),
    mapCenter: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  contact: z.object({
    email: z.string().email(),
    domain: z.string().min(1),
  }),
  url: z.string().url().optional(),
  socials: z.object({
    x: z.string().optional(),
    youtube: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    github: z.string().optional(),
    nostr: z.string().optional(),
  }).optional(),
  auth: z.object({
    allowedEmails: z.array(z.string().email()).optional(),
    appName: z.string().optional(),
  }).optional(),
  meetup: z.object({
    groupSlug: z.string(),
  }).optional(),
  notifications: z.object({
    provider: z.enum(["telegram", "slack"]),
    slackChannel: z.string().optional(),
  }).optional(),
  email: z.object({
    fromName: z.string().optional(),
    fromAddress: z.string().optional(),
  }).optional(),
  programs: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).optional(),
  theme: z.object({
    colors: z.object({
      dark: hexColor,
      darkAlt: hexColor,
      primary: hexColor,
      accent: hexColor,
      accentAlt: hexColor,
      highlight: hexColor,
      warm: hexColor,
      surface: hexColor,
      white: hexColor,
    }).partial().optional(),
    fonts: z.object({
      sans: z.string(),
      mono: z.string(),
    }).partial().optional(),
  }).optional(),
  donations: z.object({
    enabled: z.boolean().default(false),
    customDonateMessage: z.string().optional(),
  }).optional(),
  directory: z.string().optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  ogImage: z.string().optional(),
});

export type ScaffoldInput = z.infer<typeof scaffoldInputSchema>;
