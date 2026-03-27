# Config Reference

Complete reference for every field in `site.config.ts`.

## org

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full organization name. Used in metadata, legal text, and structured data. |
| `shortName` | string | Yes | Short name for nav, logo text, and compact displays. |
| `tagline` | string | Yes | One-line tagline. Used in the hero section and social previews. |
| `mission` | string | Yes | Mission statement. Displayed below the tagline on the homepage. |
| `description` | string | Yes | SEO meta description. Used in page metadata and structured data. |
| `foundedDate` | string | Yes | Founding date in `YYYY-MM` format. Shown in about page facts and structured data. |
| `founderHandle` | string | No | Founder's social handle (e.g., `@handle`). Shown on about page if set. |

## legal

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ein` | string | Yes | Employer Identification Number. Shown in footer and about page. |
| `stateRegistration` | string | No | State charity registration number. Shown in footer if set. |
| `nonprofitStatus` | string | Yes | e.g., `"501(c)(3)"`. Used throughout the site for legal references. |

## location

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `city` | string | Yes | City name. Used in metadata, content, and map configuration. |
| `state` | string | Yes | Full state name. |
| `stateAbbrev` | string | Yes | Two-letter state abbreviation. Auto-derived by CLI from state name. |
| `streetAddress` | string | No | Street address for footer and structured data. |
| `locality` | string | No | City/locality for mailing address (may differ from `city`). |
| `postalCode` | string | No | ZIP/postal code. |
| `country` | string | Yes | Country code. Defaults to `"US"`. |
| `areaDescription` | string | Yes | e.g., `"Tampa Bay area"`. Used in prose text throughout the site. |
| `mapCenter` | object | No | `{ lat: number, lng: number }` — center point for BTC Map searches. Auto-geocoded by CLI. |

## contact

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Public contact email. Shown in footer. |
| `domain` | string | Yes | Website domain without protocol. Used for auth restrictions and email config. |

## url

| Type | Required | Description |
|------|----------|-------------|
| string | Yes | Full production URL with protocol (e.g., `https://yourdomain.com`). Used for canonical URLs, structured data, and API callbacks. |

## socials

All fields are optional. Only configured socials appear in the footer.

| Field | Type | Description |
|-------|------|-------------|
| `x` | string | X/Twitter profile URL |
| `youtube` | string | YouTube channel URL |
| `instagram` | string | Instagram profile URL |
| `facebook` | string | Facebook page URL |
| `github` | string | GitHub organization URL |
| `nostr` | string | Nostr public key or profile URL |

## auth

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `allowedEmails` | string[] | Yes | List of email addresses allowed to sign up for admin. e.g., `["you@example.com", "cofounder@example.com"]` |
| `appName` | string | Yes | Shown in auth emails and the login page. |

## meetup

Optional. Omit the entire block to disable Meetup integration.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `groupSlug` | string | Yes | Your Meetup.com group URL slug (e.g., `"your-bitcoin-meetup"`). |

## notifications

Optional. Controls where contact form and payment notifications are sent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | `"telegram"` \| `"slack"` | Yes | Which service to send notifications to. |
| `slackChannel` | string | No | Slack channel name. Only used when provider is `"slack"`. |

## email

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fromName` | string | Yes | Sender name for transactional emails (e.g., `"Your Meetup"`). |
| `fromAddress` | string | Yes | Sender email address (e.g., `"noreply@yourdomain.com"`). Must match your Resend verified domain. |

## theme.colors

All values are hex color codes (e.g., `"#F7931A"`).

| Field | Description |
|-------|-------------|
| `dark` | Main background color |
| `darkAlt` | Secondary background (cards, inputs) |
| `primary` | Tertiary dark color |
| `accent` | Primary action color (buttons, links, highlights) |
| `accentAlt` | Error/warning color |
| `highlight` | Info/highlight color |
| `warm` | Warm accent (badges, secondary highlights) |
| `surface` | Text color on dark backgrounds |
| `white` | Pure white |

## theme.fonts

| Field | Type | Description |
|-------|------|-------------|
| `sans` | string | Body text font. Must be a Google Font name. |
| `mono` | string | Heading/UI font. Must be a Google Font name. |

## programs

Array of `{ name: string, description: string }`. Defines what your meetup does. Displayed on the homepage in "What We Do" and "About" sections.

## donations

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `enabled` | boolean | Yes | Whether Zaprite donations are enabled. Set to `true` when `ZAPRITE_API_KEY` is configured. |
| `customDonateMessage` | string | No | Shown on donate page when no payment provider is configured. |

## nav

| Field | Type | Description |
|-------|------|-------------|
| `links` | string[] | Route names to show in navigation. e.g., `["about", "events", "posts", "education", "donate", "contact"]` |

## footer

| Field | Type | Description |
|-------|------|-------------|
| `tagline` | string | Tagline shown in the bottom-right of the footer. |

## seo

| Field | Type | Description |
|-------|------|-------------|
| `keywords` | string[] | SEO keywords for metadata. Include your city, "bitcoin", "meetup", etc. |
