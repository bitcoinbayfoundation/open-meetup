# Vercel

Vercel hosts your website, database, and file storage. It's the recommended way to run your site — zero config, automatic deployments, and a generous free tier.

> **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)

## Why Vercel

- **Push to deploy** — connect GitHub and every push goes live automatically
- **Integrated Postgres** — database included, no external service needed
- **Blob storage** — file uploads for media and images
- **Free tier** — covers most meetup sites
- **Preview deployments** — every PR gets its own URL for testing
- **Edge network** — fast globally, SSL included

## Vercel CLI Setup

The Vercel CLI is how you deploy and manage your project from the terminal.

```bash
npm install -g vercel
vercel login
```

> **Docs:** [vercel.com/docs/cli](https://vercel.com/docs/cli)

### Linking Your Project

If you already created a Vercel project through the dashboard:

```bash
vercel link
```

This connects your local directory to the Vercel project so commands like `vercel env pull` work.

## Vercel Postgres

Your site stores posts, events, media, resources, and users in PostgreSQL.

> **Docs:** [vercel.com/docs/storage/vercel-postgres](https://vercel.com/docs/storage/vercel-postgres)

### Setup

1. Go to your Vercel project dashboard
2. Click the **Storage** tab
3. Click **Create Database** → **Postgres**
4. Name it (e.g., `meetup-db`) → **Create**
5. Click **Connect to Project** → select your project → **Connect**

Vercel automatically adds `POSTGRES_URL` to your environment variables. No manual configuration needed.

### Running Migrations

After creating the database, create the tables:

```bash
vercel env pull .env.local    # download env vars locally
pnpm db:migrate               # create all tables
```

You only need to run migrations once (or when there's a schema update).

### Local Development

Pull your Vercel env vars so local dev connects to the same database:

```bash
vercel env pull .env.local
pnpm dev
```

Your local site now connects to the Vercel Postgres database. Changes you make locally (create posts, upload media) appear in production too.

## Vercel Blob (File Storage)

Blob storage handles media uploads — event photos, post images, documents.

> **Docs:** [vercel.com/docs/storage/vercel-blob](https://vercel.com/docs/storage/vercel-blob)

### Setup

1. In your Vercel project → **Storage** tab
2. Click **Create Store** → **Blob**
3. Name it (e.g., `meetup-media`) → **Create**
4. Click **Connect to Project** → select your project → **Connect**

Vercel automatically adds `BLOB_READ_WRITE_TOKEN`. This enables the drag-and-drop media uploader in the admin panel at `/admin/media`.

## Environment Variables

All integration keys are managed through Vercel's environment variables.

> **Docs:** [vercel.com/docs/environment-variables](https://vercel.com/docs/environment-variables)

### How to Add

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Enter the **Key** (e.g., `RESEND_API_KEY`) and **Value**
3. Check environments: **Production**, **Preview**, **Development**
4. Click **Save**
5. **Redeploy** for changes to take effect

### Syncing to Local

Download all Vercel env vars to your machine:

```bash
vercel env pull .env.local
```

Run this whenever you add new variables in the dashboard.

### Required Variables

| Variable | How to Get It |
|----------|--------------|
| `POSTGRES_URL` | Auto-set by Vercel Postgres (see above) |
| `BETTER_AUTH_SECRET` | Generate: `openssl rand -base64 32` |

### Optional Variables

| Variable | Service | Guide |
|----------|---------|-------|
| `RESEND_API_KEY` | Resend | [Setup guide](/docs?tab=resend) |
| `RESEND_AUDIENCE_ID` | Resend | [Setup guide](/docs?tab=resend) |
| `ZAPRITE_API_KEY` | Zaprite | [Setup guide](/docs?tab=zaprite) |
| `TELEGRAM_BOT_TOKEN` | Telegram | [Setup guide](/docs?tab=telegram) |
| `TELEGRAM_CHAT_ID` | Telegram | [Setup guide](/docs?tab=telegram) |
| `MEETUP_CLIENT_ID` | Meetup | [Setup guide](/docs?tab=meetup) |
| `MEETUP_CLIENT_SECRET` | Meetup | [Setup guide](/docs?tab=meetup) |
| `MEETUP_OAUTH_TOKEN` | Meetup | [Setup guide](/docs?tab=meetup) |
| `MEETUP_OAUTH_REFRESH_TOKEN` | Meetup | [Setup guide](/docs?tab=meetup) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps | [Setup guide](/docs?tab=google-maps) |
| `BLOB_READ_WRITE_TOKEN` | Auto-set by Vercel Blob | See above |

## Custom Domain

> **Docs:** [vercel.com/docs/projects/domains](https://vercel.com/docs/projects/domains)

1. In Vercel: **Settings** → **Domains** → **Add Domain**
2. Enter your domain (e.g., `yourmeetup.org`)
3. Vercel shows DNS records you need to add at your registrar
4. After DNS propagates (minutes to hours), Vercel auto-provisions SSL
5. Update `site.config.ts → url` and `contact.domain` to match

## Automatic Deployments

Once connected to GitHub:
- Every push to `main` → production deployment
- Every pull request → preview deployment with a unique URL

> **Docs:** [vercel.com/docs/deployments/git](https://vercel.com/docs/deployments/git)

## Costs

Vercel's **Hobby plan** (free) includes:
- Unlimited deployments
- Vercel Postgres (256MB storage)
- Vercel Blob (limited storage)
- Custom domains with SSL
- Preview deployments

This is enough for most meetup sites. The **Pro plan** ($20/month) adds more storage and team features.

> **Pricing:** [vercel.com/pricing](https://vercel.com/pricing)
