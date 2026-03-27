import type { ScaffoldInput } from "./schemas.js";
import { DEFAULT_PROGRAMS } from "./programs.js";

export const DEFAULTS: ScaffoldInput = {
  org: {
    name: "My Bitcoin Meetup",
    shortName: "BTC Meetup",
    tagline: "Your city's Bitcoin community",
    mission: "Building the bitcoin community through education, meetups, and advocacy for sound money.",
    description: "A 501(c)(3) nonprofit dedicated to Bitcoin education, community meetups, and events.",
    foundedDate: new Date().toISOString().slice(0, 7),
  },
  legal: {
    ein: "XX-XXXXXXX",
    nonprofitStatus: "501(c)(3)",
  },
  location: {
    city: "Your City",
    state: "Your State",
    stateAbbrev: "XX",
    streetAddress: "",
    locality: "",
    postalCode: "",
    country: "US",
  },
  contact: {
    email: "hello@example.com",
    domain: "example.com",
  },
  socials: {},
  theme: {
    colors: {
      dark: "#111111",
      darkAlt: "#1A1A1A",
      primary: "#2A2A2A",
      accent: "#F7931A",
      accentAlt: "#D4483B",
      highlight: "#3B82F6",
      warm: "#FBBF24",
      surface: "#E5E5E5",
      white: "#FFFFFF",
    },
    fonts: {
      sans: "IBM Plex Sans",
      mono: "IBM Plex Mono",
    },
  },
  programs: DEFAULT_PROGRAMS,
  donations: {
    enabled: false,
  },
};
