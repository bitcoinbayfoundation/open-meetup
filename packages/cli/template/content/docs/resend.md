# Resend

[Resend](https://resend.com) powers your newsletter and email communications — subscriber management, contact form email capture, and password resets for admin accounts.

**Recommended.** Without Resend, the newsletter subscribe form won't work and admin password resets won't send.

## What It Powers

- **Newsletter** — the footer subscribe form and contact form add subscribers to your Resend audience
- **Password resets** — admin users can reset their passwords via email
- **Subscriber management** — view and manage subscribers in the admin panel at `/admin/newsletter`

## Setup

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email address

### 2. Verify Your Domain

Resend needs to verify your domain so emails come from your address (e.g., `noreply@yourmeetup.org`) instead of Resend's generic domain.

1. In Resend → **Domains** → **Add Domain**
2. Enter your domain (e.g., `yourmeetup.org`)
3. Resend shows DNS records you need to add — these are typically MX and TXT records
4. Add these records at your domain registrar (the same place you manage DNS for Vercel)
5. Back in Resend, click **Verify**
6. Verification usually takes a few minutes but can take up to 24 hours

> **Resend Docs:** [resend.com/docs/dashboard/domains/introduction](https://resend.com/docs/dashboard/domains/introduction)

### 3. Create an API Key

1. In Resend → **API Keys** → **Create API Key**
2. Name: `meetup-website`
3. Permission: **Full access**
4. Click **Create** and copy the key (starts with `re_`)

### 4. Create a Newsletter Audience

This is where your subscribers are stored.

1. In Resend → **Audiences** → **Create Audience**
2. Name it `Newsletter` (or whatever you prefer)
3. Click on the audience you just created
4. The **Audience ID** is the UUID in the URL bar — copy it

### 5. Add to Vercel

In your Vercel project → **Settings** → **Environment Variables**:

| Key | Value | Example |
|-----|-------|---------|
| `RESEND_API_KEY` | Your API key | `re_abc123...` |
| `RESEND_AUDIENCE_ID` | Your audience ID | `a1b2c3d4-e5f6-...` |

Check all environments → **Save** → **Redeploy**.

## Configuration

The sender name and address are set in `site.config.ts`:

```typescript
email: {
  fromName: "Your Meetup",
  fromAddress: "noreply@yourmeetup.org",
},
```

The `fromAddress` domain must match the domain you verified in Resend. If they don't match, emails will fail to send.
