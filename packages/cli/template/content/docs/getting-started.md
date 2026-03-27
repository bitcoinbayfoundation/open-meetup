# Getting Started

This guide walks you through deploying your Bitcoin meetup website on Vercel. No coding experience needed — just follow the steps.

## Prerequisites

You need:

- **Node.js 18+** — [download here](https://nodejs.org)
- **pnpm** — install with `npm install -g pnpm`
- **Vercel CLI** — install with `npm install -g vercel`

The CLI scaffold (`npx @bitcoinbay/open-meetup`) checks for these and offers to install them if missing.

## Step 1: Scaffold Your Project

If you haven't already:

```bash
npx @bitcoinbay/open-meetup my-meetup
```

Follow the interactive prompts. This creates your project with your organization name, location, programs, and colors already configured. Your admin email is added to the allowed signup list in the config.

## Step 2: Deploy to Vercel

```bash
cd my-meetup
vercel
```

The Vercel CLI will:
1. Ask you to log in (first time only)
2. Create a new Vercel project
3. Deploy your site

Your site is now live at a `.vercel.app` URL.

## Step 3: Set Up the Database

Your site needs a PostgreSQL database for posts, events, media, and users.

1. Go to your project at [vercel.com](https://vercel.com)
2. Click the **Storage** tab
3. Click **Create Database** → **Postgres**
4. Name it (e.g., `my-meetup-db`) and click **Create**
5. Click **Connect to Project** → select your project → **Connect**

Vercel automatically sets `POSTGRES_URL` in your environment variables.

Now create the database tables:

```bash
vercel env pull .env.local
pnpm db:migrate
```

You should see each migration succeed:

```
Running 1 migration(s)...
  → 001_init.sql
    ✓ done

✓ All migrations applied.
```

## Step 4: Add Auth Secret

Generate a secret key for admin sessions:

```bash
openssl rand -base64 32
```

Add it to Vercel:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Key: `BETTER_AUTH_SECRET`
3. Value: paste the secret you just generated
4. Check all environments (Production, Preview, Development)
5. Click **Save**

## Step 5: Redeploy

Environment variables only take effect after a new deployment:

```bash
vercel --prod
```

Or in the Vercel dashboard: **Deployments** → latest → three dots → **Redeploy**.

## Step 6: Create Your Admin Account

1. Visit `https://your-site.vercel.app/admin/signup`
2. Sign up with the email you added during setup (the one in `site.config.ts → auth.allowedEmails`)
3. Visit `/admin/setup-2fa` to enable two-factor authentication
4. You're in. Access the admin panel at `/admin`

To add more team members later, add their emails to the allowed list in `site.config.ts` and redeploy.

## Step 7: Run the Doctor

Visit **[/admin/doctor](/admin/doctor)** to see your full setup status.

The doctor checks every environment variable, content file, brand asset, and config value. Each item that needs attention has a **"view setup guide →"** link to the relevant docs page.

Use it as your checklist — work through the warnings one at a time.

## Step 8: Custom Domain

1. In Vercel: **Settings** → **Domains** → **Add Domain**
2. Enter your domain (e.g., `yourmeetup.org`)
3. Vercel shows DNS records to add at your domain registrar
4. After DNS propagates (~5 min to a few hours), Vercel auto-provisions SSL
5. Update `site.config.ts → url` and `contact.domain` to match
6. Push and redeploy

## Adding Environment Variables

You'll do this for each integration you set up. The process is always:

1. Vercel project → **Settings** → **Environment Variables**
2. Enter the **Key** and **Value**
3. Check all environments (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** (`vercel --prod` or dashboard → Redeploy)

To sync Vercel env vars to your local machine:

```bash
vercel env pull .env.local
```

## Next Steps

Set up integrations one at a time. None are required — add them as you need them:

| Integration | What it does | Priority |
|-------------|-------------|----------|
| **[Resend](/docs?tab=resend)** | Newsletter subscriptions, password resets | Recommended |
| **[Telegram](/docs?tab=telegram)** | Notifications for contact form & donations | Recommended |
| **[Zaprite](/docs?tab=zaprite)** | Bitcoin donation checkout | When ready for donations |
| **[Meetup](/docs?tab=meetup)** | Event sync with Meetup.com | If you use Meetup.com |
| **[Google Maps](/docs?tab=google-maps)** | Interactive merchant map view | Optional |

Then add your content:
- **[Content Guide](/docs?tab=content-guide)** — about page, FAQs, donation tiers, blog posts
- **[Customization](/docs?tab=customization)** — colors, programs, brand assets
