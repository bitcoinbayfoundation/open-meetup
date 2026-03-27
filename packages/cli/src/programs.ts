export interface Program {
  name: string;
  description: string;
}

export const AVAILABLE_PROGRAMS: Program[] = [
  {
    name: "community meetups",
    description: "Regular gatherings for bitcoiners of all levels. Just heard about Bitcoin? Been stacking for years? There's a seat at the table.",
  },
  {
    name: "education & workshops",
    description: "Wallets, self-custody, lightning, running your own node. Hands-on, no gatekeeping.",
  },
  {
    name: "bitdevs",
    description: "Technical developer discussions covering Bitcoin Core, Lightning Network, protocol development, and open-source projects.",
  },
  {
    name: "business onboarding",
    description: "Helping local businesses accept Bitcoin payments, integrate Lightning for point-of-sale, and operate on a Bitcoin standard.",
  },
  {
    name: "community service",
    description: "Service events, family-friendly gatherings, and community building beyond the meetup.",
  },
  {
    name: "annual events",
    description: "Charity galas, fundraisers, and special events to bring the broader community together.",
  },
  {
    name: "group chat",
    description: "Always-on community chat for members to connect, ask questions, and share resources between events.",
  },
];

export const DEFAULT_PROGRAMS: Program[] = [
  AVAILABLE_PROGRAMS[0], // community meetups
  AVAILABLE_PROGRAMS[1], // education & workshops
];
