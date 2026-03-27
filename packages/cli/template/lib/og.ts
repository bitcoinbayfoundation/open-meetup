import { Metadata } from "next";
import config from "@/site.config";

const BASE = config.url;

export const genMetadata = ({
  title,
  description,
  image,
  path,
}: {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
}): Metadata => ({
  title: title || config.org.name,
  description:
    description ||
    config.org.description,
  icons: {
    icon: "/favicon.svg",
  },
  ...(path !== undefined && {
    alternates: {
      canonical: `${BASE}${path}`,
    },
  }),
  openGraph: {
    title: title || config.org.name,
    description:
      description ||
      config.org.tagline,
    images: [
      {
        url: image || "/og/home.png",
        width: 1200,
        height: 630,
        alt: title || config.org.name,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: title || config.org.name,
    description:
      description ||
      config.org.tagline,
    images: [image || "/og/home.png"],
  },
});
