# Building the Bitcoin Bay Website — Thread Notes

Scratchpad for tweeting about the experience of building bitcoinbay.foundation from scratch.

---

## The Stack
- Next.js + TypeScript + Tailwind CSS
- PostgreSQL database with raw SQL migrations
- Vercel Blob for media storage
- pnpm as the package manager
- Built with Claude Code as an AI pair-programmer

## Feature-by-Feature Breakdown

### Landing Page & Brand Identity
- Cypherpunk-inspired dark theme, not your typical nonprofit corporate look
- Custom gradient mark SVG, brand kit page where supporters can grab logos
- Supporter logos section (Unchained, CoinFlip, Synota, BlockSpaces, etc.)
- Embedded video from Sound Money Soiree on the homepage

### Admin Panel & Auth
- Full admin dashboard behind auth with Better Auth
- Email/password login with Resend for transactional emails
- Forgot password flow
- Two-factor authentication (TOTP) with QR code setup
- Role-based access — admin plugin gates all management pages

### Blog / Posts System
- Rich text editor in the admin panel
- Markdown rendering on the public side
- Slug-based routing, SEO metadata per post
- Image uploads inline via Vercel Blob

### Events System
- Full CRUD for events in admin
- RSVP functionality for attendees
- Cross-posting events to Meetup via their GraphQL v2 API
- Meetup OAuth integration for authentication
- Admin debug page to inspect Meetup API responses
- Had to migrate from Meetup REST API to GraphQL v2 — the old API was deprecated
- Dedicated Meetup sync page in admin — pulls events from Meetup.com automatically
- Selective import: preview any Meetup event, then import it to display on the site
- RSVP sync: pull latest RSVPs from Meetup.com with one click
- Bidirectional sync: edits made on our end push back to Meetup.com automatically

### Media Management
- Media explorer in admin — upload, browse, delete assets from Vercel Blob
- Image optimization pipeline (Sharp) — bulk optimize uploaded images
- Photo gallery page pulling from the media library
- Gallery images on the front page

### SEO & Discoverability
- Per-page metadata with Open Graph images
- Dynamic sitemap.ts generation
- robots.ts configuration
- Structured metadata on every route (about, events, education, donate, etc.)
- JSON-LD structured data on blog posts

### Analytics
- Vercel Analytics integration — one package install, two lines of code

### Newsletter & Subscribers
- Subscribe form in the footer site-wide
- Admin panel for managing contacts
- Resend integration for sending emails

### Education & Resources
- Education page with tabbed interface
- Resources CRUD in admin — curated links, guides, tools
- Categorized resource library on the public site

### Donate Page
- Multiple donation methods: on-chain Bitcoin, Lightning, DAF (Donor Advised Fund)
- Employer match guide page
- Clean UX for a nonprofit asking for sats

### Contact & Slack Integration
- Contact form that posts submissions to a Slack channel via webhook
- Slack bot handles incoming form data so the team gets notified instantly

### Agent API & API Keys
- Built a full REST API for AI agents to publish content programmatically
- API key management in admin — create, revoke, rename keys
- Keys are attributed to users for audit trails
- Agents can create/update posts, events, resources, upload media, query subscribers
- Claude Code skill file so AI agents can interact with the site via CLI

### Map Integration
- Interactive Bitcoin-friendly business map (BTC Map data)
- Embedded map view on the site

### Meetup API Deep Dive
- OAuth callback flow for Meetup authentication
- Migrated from REST to GraphQL v2 — documented the full schema
- Admin debug panel to test API queries live
- SSL updates for database connections in production

### Database & Migrations
- Raw SQL migration files, run with psql — no ORM migration tool
- Migrations for: auth tables, posts, media, admin plugin, 2FA, events, RSVPs, resources, API key user attribution

### Design Philosophy
- Dark, bold, unapologetically Bitcoin
- Not a template — every page hand-crafted
- Accessibility via contrast improvements on admin pages
- Mobile-responsive nav and layouts

---

---

## Thread 1: BTC Map Integration

**Hook:** Shoutout to @BtcMap — one of the most underrated public goods in Bitcoin.

**Talking points:**
- We needed a way to show that Tampa Bay has real Bitcoin adoption happening — not just meetups, but actual businesses accepting sats
- BTC Map's API made it dead simple: one fetch call to `/v4/places/search/` with a lat/lon and radius, and you get back every Bitcoin-accepting merchant in the area
- No API key required. No rate limiting headaches. No auth tokens. Just open data, open source, free to use
- The data is rich — each place comes with name, address, coordinates, website, phone, social links, photos, payment provider info, opening hours, verification status, and even community comments
- We built a full searchable directory from it: category filters (food & drink, ATMs, retail, services, automotive, health, tech, etc.), text search, expandable detail cards
- Added an interactive Google Maps view on top — custom dark-themed map with orange Bitcoin markers, click a pin and get a slide-out drawer with all the business details
- The verified_at field lets us show users which merchants have been community-verified — that trust layer matters
- 50km radius around Tampa Bay pulls in dozens of real businesses — restaurants, barbers, car shops, ATMs, real estate agents — proof that the circular economy is growing
- All of this was possible because BTC Map maintains this data as a public good. No paywall, no corporate API terms, just Bitcoiners mapping Bitcoiners
- Built the whole integration in one session — custom React hook (`useBTCMap`), typed interfaces, list view + map view with category filtering. The API just works

**CTA:** If you use Bitcoin and care about merchant adoption being visible, donate to BTC Map: https://btcmap.org/support-us — they're doing essential infrastructure work for the Bitcoin economy

**Tag:** @BtcMap

---

## Thread 2: Zaprite API — The Gold Standard

**Hook:** I need to talk about @ZapriteApp because they just set the bar for what a developer experience should look like in 2026.

**Talking points:**
- We use Zaprite for everything at Bitcoin Bay — payments, donations, and their new ticket feature was phenomenal for our Sound Money Soiree event
- Wanted to go deeper: webhook events piped to Slack so the team gets notified on payments, custom checkout flows, pulling transaction data into our site
- What happened next was the smoothest API integration I've ever done. Full stop. Here's why:
- **They have an llms.txt file.** Their entire API documented in a format that AI coding tools can consume natively. No hallucinated endpoints, no guessing at params — Claude had the full picture immediately
- **They ship their own NPM client package.** The AI didn't have to generate a janky HTTP wrapper or guess at auth patterns. Just install the package, import it, and go. Types included
- **Open API spec on top of that.** So you've got the machine-readable spec, the LLM-optimized docs, AND a typed client library. The trifecta
- From zero to fetching live data in my app in about 10 minutes. Not exaggerating. That's install, auth, first successful API call, data rendering
- This is what every Bitcoin company should be studying. If you want developers to build on your platform, give them: (1) an llms.txt so AI tools don't hallucinate your API, (2) a typed client package so nobody's hand-rolling HTTP calls, (3) a clean OpenAPI spec for everything else
- The contrast with other APIs I've integrated (looking at you, Meetup GraphQL migration) is night and day
- Zaprite understood that in the AI-assisted development era, your docs aren't just for humans anymore. The llms.txt file alone probably saved me hours of debugging wrong endpoints

**What we actually built with it:**
- Donate page with quick-select amounts ($10, $25, $50, $100) or custom amount — click "donate" and it creates a Zaprite order on the fly via `zaprite.orderCreate()`, sets a redirect URL back to our site
- No more external payment links that strand users on a third-party page. The donor clicks, pays (Bitcoin, Lightning, card, bank — whatever), and gets redirected back to a Bitcoin Bay "thank you" page
- The thank-you page fetches the order details from Zaprite (`zaprite.orderGetById()`) and shows them exactly what they paid, the method (on-chain, Lightning, card, etc.), the date, and the status — all on our own branded page
- Zaprite webhook fires on `order.change` events — we catch paid orders and pipe a rich Slack notification to our #sales channel: amount, customer name, payment method, sats received, link to the order. The team knows instantly when money comes in
- The Soiree use case: at live events, when someone pays on a phone, they won't hand the phone back until they see confirmation. Now they see our branded thank-you page with a green "complete" status — not some random third-party receipt. That's the UX win
- Admin dashboard pulls order history, revenue summaries, BTC vs fiat breakdown, contact management — all through the same `@zaprite/api` client
- Future: ticket purchases, merch, any checkout flow — same pattern. Create order, redirect to Zaprite, bounce back to our thank-you page

**CTA:** If you're a Bitcoin business and you're not using @ZapriteApp for payments, you're making your life harder than it needs to be. And if you're a developer — their API is a joy to work with.

**Tag:** @ZapriteApp

---

## Thread 3: Slack Bot — The Website Talks to Us

**Hook:** One of the best decisions we made building the new Bitcoin Bay website: a Slack bot that turns the website into a teammate.

**Talking points:**
- We built a "Website Bot" in Slack that pipes activity from the site directly into channels the team already lives in. No checking dashboards, no logging into admin panels — the website tells us what's happening
- **Contact form → #contact-page channel:** Someone fills out the contact form on bitcoinbay.foundation/contact, and within seconds the team gets a rich Slack message — their name, email (clickable mailto link), and the full message formatted as a blockquote. Timestamp and source page included. We can reply to them right from our inbox
- **Bonus:** Every contact form submission also auto-subscribes them to our newsletter via Resend. One form, two outcomes — they get a response from us AND future updates. No extra friction for the user
- **Zaprite payments → #sales channel:** When a donation or payment completes, the Zaprite webhook fires and our bot posts a detailed notification — amount, customer name, payment method (with a ₿ emoji for Bitcoin payments, 💳 for card), sats received, order type, and a direct link to the order. The team knows the instant money comes in
- The Slack integration is dead simple under the hood — one utility function (`sendSlackMessage`) that takes a channel name, fallback text, and Block Kit blocks. Maybe 20 lines of code. The `@slack/web-api` package handles everything
- Why this matters for a nonprofit: we're a small team. Nobody has time to check a dashboard twice a day. But everyone's already in Slack. So the website comes to us — "hey, someone wants to talk" or "hey, someone just donated $100 via Lightning." That's it. That's the workflow
- The rich formatting matters too — Block Kit lets you structure messages with sections, dividers, fields, timestamps. It doesn't look like a bot dump, it looks like a real notification you actually want to read

**The pattern:** Website event happens → API route handles it → `sendSlackMessage()` fires → team sees it in real time. Contact form, payments, and easily extensible to anything else (RSVPs, new blog comments, whatever)

**Tag:** @SlackAPI

---

## Thread 4: AI-Generated OG Images with Nano Banana

**Hook:** Here's a 5-minute detail that makes your site look 10x more polished when shared — AI-generated Open Graph images for every page.

**Talking points:**
- OG images are those preview cards you see when a link gets shared on Twitter, Slack, iMessage, Discord — they're a small detail that most people skip, but they massively impact whether someone clicks
- We already had a base OG image with the Bitcoin Bay branding and Tampa skyline. The question was: do we use that same generic image for every single page, or do we make each page feel intentional?
- Used the Nano Banana skill on OpenRouter — it's an image generation model you can run through Claude Code. Gave it our existing OG as a reference for the style/branding, then had it generate a unique OG image for every static page
- Generated 12 unique images: home, about, events, education, contact, donate, brand, photos, media, posts, map, Sound Money Soiree — all dropped into `public/og/`
- Each page references its own OG image through a `genMetadata()` helper that sets OpenGraph and Twitter card metadata. Dynamic pages (blog posts, individual events) fall back to the default or use their own featured image
- The whole thing took about 5 minutes — install the skill, point it at the existing OG, tell it what pages you need, done. That's the kind of leverage AI gives you on the small stuff that adds up
- These details matter for a nonprofit especially — when someone shares your donate page or event page, you want that preview card to look intentional, not like an afterthought

**Skill link:** https://skills.sh/github/awesome-copilot/nano-banana-pro-openrouter

**Pages with custom OG images:** home, about, events, education, contact, donate, brand, photos, media, posts, map, sound-money-soiree

---

## Thread 5: SEO — Making a Nonprofit Discoverable

**Hook:** Nobody's going to find your Bitcoin community if Google doesn't know it exists. Here's how we handled SEO for bitcoinbay.foundation using two Claude Code skills.

**Talking points:**
- SEO is one of those things nonprofits skip because it feels like a marketing chore. But if someone in Tampa Googles "bitcoin meetup tampa" and you don't show up — you don't exist to them
- Used two skills from @coreyhaines31 to audit and optimize the site:
  - **SEO Audit** — ran a full technical audit of the site to catch issues: missing metadata, broken structured data, crawl problems, page speed concerns. It's like a health check for discoverability
  - **AI SEO** — optimized content so it surfaces in AI-generated answers (ChatGPT, Perplexity, Claude, Google AI Overviews). This is the new frontier — people aren't just Googling anymore, they're asking AI "where's the Bitcoin meetup in Tampa?"
- What we implemented based on the audits:
  - **JSON-LD structured data** on the root layout — `NonprofitOrganization` schema with tax ID, founding date, area served, address, social links, and `knowsAbout` covering Bitcoin, Lightning Network, blockchain, etc. Plus a `WebSite` schema
  - **Per-page metadata** — every route has its own title, description, and OG image via `genMetadata()`. Not one generic meta tag across the whole site
  - **Dynamic sitemap** that queries the database for published blog posts and merges them with static pages, each with appropriate change frequencies and priorities
  - **robots.ts** — allow everything public, block `/admin/` and `/api/`, point to the sitemap
  - **Canonical URLs** and `metadataBase` set properly
  - **Keywords array** targeting real search terms: "bitcoin tampa", "cryptocurrency meetup tampa", "blockchain events tampa florida"
- The AI SEO angle is underrated for Bitcoin communities — when someone asks an AI assistant "how do I learn about Bitcoin in Tampa?", your structured data and semantic content is what gets you cited. This isn't traditional SEO anymore
- Both skills took maybe 15 minutes total to run and implement the recommendations. That's the value of having purpose-built skills — you don't need to be an SEO expert, you just need the right tools

**Skill links:**
- SEO Audit: https://skills.sh/coreyhaines31/marketingskills/seo-audit
- AI SEO: https://skills.sh/coreyhaines31/marketingskills/ai-seo

**Tag:** @coreyhaines31

---

## Thread 6: Meetup Sync — Bidirectional Event Management

**Hook:** We built a Meetup sync engine so our admin panel and Meetup.com stay in lockstep — no more copy-pasting event details between platforms.

**Talking points:**
- Running a Bitcoin meetup means you live on Meetup.com — that's where people discover you and RSVP. But your own website is where you control the brand and the experience. The problem: keeping both in sync is tedious manual work
- We built a dedicated Meetup admin page that pulls all our events from the Tampa Bay Bitcoin Meetup group via their GraphQL v2 API — upcoming and past events, group stats, member count, everything
- **Import flow:** Browse your Meetup events, click preview to see the description, image, and full list of RSVP'd attendees. Hit import and the event + all RSVPs get created on our site instantly
- **RSVP sync:** Someone RSVPs on Meetup.com after you've already imported the event? One click to sync the latest attendees without re-importing the whole event
- **Bidirectional push:** Make changes to an event on our end — updated description, new time, whatever — and those changes push back to Meetup.com automatically. One source of truth, two platforms
- This matters for any organization running events across multiple platforms. You shouldn't have to choose between "nice website" and "where people actually RSVP." You can have both, in sync
- The Meetup GraphQL v2 API is… an experience. Their docs are sparse, the schema is massive, and some fields don't return what you'd expect (baseUrl on photos returns a directory path, not a URL — you need highResUrl). But once you figure out the quirks, the integration is solid
- For the RSVP import: we fetch up to 200 RSVPs per event with member names and create them all in parallel. Gives organizers instant visibility into who's coming without any manual data entry

**Tag:** @Meetup

---

## Interesting Moments / Talking Points
- Using AI to build a nonprofit website end-to-end
- The Meetup API migration was a pain — their docs are scattered and the GraphQL schema is massive
- Building an agent API so AI can publish to the site autonomously
- Raw SQL migrations instead of an ORM — intentional simplicity
- Slack webhook for contact form = instant team notifications without building a backend notification system
- Two-factor auth on a nonprofit site — security matters even for small orgs
- Image optimization pipeline saves bandwidth and load times
- The brand kit page — making it easy for supporters and media to grab assets
