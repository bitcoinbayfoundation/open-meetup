import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import config from "@/site.config";
import "./globals.css";
import Nav from "./nav";
import Footer from "./footer";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${config.org.name} — Bitcoin Meetups in ${config.location.city}, ${config.location.stateAbbrev}`,
  description: config.org.description,
  keywords: config.seo.keywords,
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: `${config.org.name} — ${config.location.city}'s Bitcoin Community`,
    description: `${config.location.city}'s ${config.legal.nonprofitStatus} nonprofit for Bitcoin education, meetups, and community events. Join us in ${config.location.city}, ${config.location.stateAbbrev}.`,
    images: [
      {
        url: "/og/home.png",
        width: 1200,
        height: 630,
        alt: `${config.org.name} — Bitcoin community in ${config.location.city}, ${config.location.state}`,
      },
    ],
    type: "website",
    siteName: config.org.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${config.org.name} — ${config.location.city}'s Bitcoin Community`,
    description: `${config.location.city}'s ${config.legal.nonprofitStatus} nonprofit for Bitcoin education, meetups, and community events. Join us in ${config.location.city}, ${config.location.stateAbbrev}.`,
    images: ["/og/home.png"],
  },
  metadataBase: new URL(
    process.env.BETTER_AUTH_URL || config.url,
  ),
  alternates: {
    canonical: config.url,
  },
  other: {
    generator: "Open Meetup by Bitcoin Bay Foundation — bitcoinbay.foundation",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "NonprofitOrganization",
  name: config.org.name,
  alternateName: config.org.shortName,
  url: config.url,
  logo: `${config.url}/brand/logo.png`,
  image: `${config.url}/og.webp`,
  description: config.org.description,
  foundingDate: config.org.foundedDate,
  taxID: config.legal.ein,
  nonprofitStatus: config.legal.nonprofitStatus,
  areaServed: {
    "@type": "City",
    name: config.location.city,
    containedInPlace: {
      "@type": "State",
      name: config.location.state,
    },
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: config.location.streetAddress,
    addressLocality: config.location.locality,
    addressRegion: config.location.stateAbbrev,
    postalCode: config.location.postalCode,
    addressCountry: config.location.country,
  },
  sameAs: [
    config.socials.x,
    config.socials.youtube,
    config.socials.instagram,
    config.socials.facebook,
    ...(config.meetup ? [`https://www.meetup.com/${config.meetup.groupSlug}/`] : []),
  ].filter(Boolean),
  keywords: config.seo.keywords.join(", "),
  knowsAbout: [
    "Bitcoin",
    "Blockchain Technology",
    "Lightning Network",
    "Digital Currency",
    "Sound Money",
    "Self-Custody",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: config.org.name,
  alternateName: config.org.shortName,
  url: config.url,
  description: config.org.description,
  publisher: {
    "@type": "Organization",
    name: config.org.name,
    url: config.url,
  },
  creator: {
    "@type": "Organization",
    name: "Bitcoin Bay Foundation",
    url: "https://bitcoinbay.foundation",
  },
  inLanguage: "en-US",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} antialiased`}
    >
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root {
  --color-t-dark: ${config.theme.colors.dark};
  --color-t-dark-alt: ${config.theme.colors.darkAlt};
  --color-t-primary: ${config.theme.colors.primary};
  --color-t-accent: ${config.theme.colors.accent};
  --color-t-accent-alt: ${config.theme.colors.accentAlt};
  --color-t-highlight: ${config.theme.colors.highlight};
  --color-t-warm: ${config.theme.colors.warm};
  --color-t-surface: ${config.theme.colors.surface};
  --color-t-white: ${config.theme.colors.white};
}`,
          }}
        />
        <link rel="preconnect" href="https://f.vimeocdn.com" />
        <link rel="preconnect" href="https://i.vimeocdn.com" />
        <link rel="preconnect" href="https://gf3ot543c0hsecwt.public.blob.vercel-storage.com" />
        <link rel="dns-prefetch" href="https://gf3ot543c0hsecwt.public.blob.vercel-storage.com" />
      </head>
      <body className="min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Nav />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
