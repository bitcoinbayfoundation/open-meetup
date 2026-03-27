import rawFaqs from "@/content/faqs.json";
import rawTiers from "@/content/donation-tiers.json";

export interface Faq {
  question: string;
  answer: string;
}

export interface DonationTier {
  name: string;
  range: string;
  description: string;
}

interface FaqsByPage {
  home: Faq[];
  about: Faq[];
  donate: Faq[];
  education: Faq[];
}

export const faqs: FaqsByPage = rawFaqs as FaqsByPage;
export const donationTiers: DonationTier[] = rawTiers as DonationTier[];
