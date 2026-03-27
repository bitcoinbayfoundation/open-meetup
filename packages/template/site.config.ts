export interface SiteConfig {
  org: {
    name: string;
    shortName: string;
    tagline: string;
    mission: string;
    description: string;
    foundedDate: string;
    founderHandle?: string;
  };
  legal: {
    ein: string;
    stateRegistration?: string;
    nonprofitStatus: string;
  };
  location: {
    city: string;
    state: string;
    stateAbbrev: string;
    streetAddress: string;
    locality: string;
    postalCode: string;
    country: string;
    areaDescription: string;
    mapCenter?: { lat: number; lng: number };
  };
  contact: {
    email: string;
    domain: string;
  };
  url: string;
  socials: {
    x?: string;
    youtube?: string;
    instagram?: string;
    facebook?: string;
    github?: string;
    nostr?: string;
  };
  auth: {
    allowedEmails: string[];
    appName: string;
  };
  meetup?: {
    groupSlug: string;
  };
  notifications?: {
    provider: "slack" | "telegram";
    slackChannel?: string;
  };
  email: {
    fromName: string;
    fromAddress: string;
  };
  theme: {
    colors: {
      dark: string;
      darkAlt: string;
      primary: string;
      accent: string;
      accentAlt: string;
      highlight: string;
      warm: string;
      surface: string;
      white: string;
    };
    fonts: {
      sans: string;
      mono: string;
    };
  };
  donations: {
    enabled: boolean;
    customDonateMessage?: string;
  };
  programs: Array<{
    name: string;
    description: string;
  }>;
  nav: {
    links: string[];
  };
  footer: {
    tagline: string;
  };
  seo: {
    keywords: string[];
  };
}

const config: SiteConfig = {
  org: {
    name: "My Bitcoin Meetup",
    shortName: "BTC Meetup",
    tagline: "Your city's Bitcoin community",
    mission:
      "Building the bitcoin community through education, meetups, and advocacy for sound money.",
    description:
      "A 501(c)(3) nonprofit dedicated to Bitcoin education, community meetups, and events.",
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
    areaDescription: "Your City area",
  },
  contact: {
    email: "hello@example.com",
    domain: "example.com",
  },
  url: "https://example.com",
  socials: {},
  auth: {
    allowedEmails: ["hello@example.com"],
    appName: "BTC Meetup",
  },
  notifications: {
    provider: "telegram",
  },
  email: {
    fromName: "BTC Meetup",
    fromAddress: "noreply@example.com",
  },
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
  donations: {
    enabled: false,
  },
  programs: [
    { name: "community meetups", description: "Regular gatherings for bitcoiners of all levels. Just heard about Bitcoin? Been stacking for years? There's a seat at the table." },
    { name: "education & workshops", description: "Wallets, self-custody, lightning, running your own node. Hands-on, no gatekeeping." },
  ],
  nav: {
    links: ["about", "events", "posts", "education", "donate", "contact"],
  },
  footer: {
    tagline: "don't trust. verify.",
  },
  seo: {
    keywords: [
      "bitcoin",
      "meetup",
      "blockchain",
      "education",
      "nonprofit",
      "community",
      "events",
      "workshops",
    ],
  },
};

export default config;
