# Customization

## Theme Colors

Colors are defined in `site.config.ts → theme.colors` and injected as CSS custom properties at build time.

```typescript
theme: {
  colors: {
    dark: "#111111",      // Main background
    darkAlt: "#1A1A1A",   // Card backgrounds, secondary surfaces
    primary: "#2A2A2A",   // Tertiary dark
    accent: "#F7931A",    // Buttons, links, highlights (bitcoin orange by default)
    accentAlt: "#D4483B", // Errors, warnings, destructive actions
    highlight: "#3B82F6", // Info highlights
    warm: "#FBBF24",      // Warm accent (badges, tags)
    surface: "#E5E5E5",   // Text color on dark backgrounds
    white: "#FFFFFF",     // Pure white
  },
}
```

Changes to these values take effect on the next build. The entire site's color scheme is driven by these 9 values.

## Fonts

Fonts are configured in `site.config.ts → theme.fonts`:

```typescript
theme: {
  fonts: {
    sans: "IBM Plex Sans",  // Body text
    mono: "IBM Plex Mono",  // Headings, UI, code
  },
}
```

The site uses Google Fonts. If you change fonts, you'll also need to update the font imports in `app/layout.tsx`.

## Programs

Programs define what your meetup does. They're shown in the "What We Do" and "About" sections on the homepage.

```typescript
programs: [
  {
    name: "community meetups",
    description: "Regular gatherings for bitcoiners of all levels.",
  },
  {
    name: "education & workshops",
    description: "Wallets, self-custody, lightning. Hands-on, no gatekeeping.",
  },
  {
    name: "bitdevs",
    description: "Technical developer discussions on Bitcoin Core and Lightning.",
  },
],
```

Add, remove, or reorder programs as needed. Each gets a numbered card on the homepage.

## Brand Assets

### Logo

Place your logo at `public/brand/logo.svg` (or `logo.png`). It's used in:
- Navigation bar
- Footer
- Brand kit page

The default is a placeholder Bitcoin symbol. Replace it with your organization's logo.

### Favicon

Place at `public/favicon.svg` (or `favicon.ico`). Shows in browser tabs.

### Social Preview (OG Image)

Place at `public/og/default.png` (1200x630px recommended). Used when your site is shared on social media.

## Navigation

The nav links are configured in `site.config.ts → nav.links`:

```typescript
nav: {
  links: ["about", "events", "posts", "education", "donate", "contact"],
},
```

Each entry maps to a route. Remove entries to hide pages from the nav.

## Footer

The footer tagline is set in `site.config.ts → footer.tagline`:

```typescript
footer: {
  tagline: "don't trust. verify.",
},
```

The footer columns (Foundation, Resources) are defined in `app/footer.tsx` and can be customized there directly.

## Social Links

Configure in `site.config.ts → socials`:

```typescript
socials: {
  x: "https://x.com/yourmeetup",
  youtube: "https://youtube.com/@yourmeetup",
  instagram: "https://instagram.com/yourmeetup",
  // Also supports: facebook, github, nostr
},
```

Only configured socials appear in the footer. Omit any you don't use.
