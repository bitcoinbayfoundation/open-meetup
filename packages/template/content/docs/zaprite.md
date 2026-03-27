# Zaprite

[Zaprite](https://zaprite.com) enables Bitcoin, Lightning, credit card, and bank transfer donations through a single checkout experience.

**Optional.** Without Zaprite, the donate page still works but the quick-donate form shows a setup message. You can add Zaprite whenever you're ready to accept donations.

## What It Powers

- **One-time donations** — visitors pick an amount on `/donate`, get redirected to Zaprite checkout
- **Multiple payment methods** — Bitcoin (on-chain), Lightning, credit/debit card, ACH bank transfer
- **Payment notifications** — Telegram/Slack alerts when a donation comes in
- **Thank-you page** — donors return to `/donate/thank-you` after payment

## Setup

### 1. Create a Zaprite Account

1. Go to [zaprite.com](https://zaprite.com) and sign up
2. Complete your organization profile
3. Connect your payment methods — follow Zaprite's onboarding to link your Bitcoin wallet, bank account, or card processor

> **Zaprite Docs:** [docs.zaprite.com](https://docs.zaprite.com)

### 2. Create an API Key

1. In Zaprite → **Settings** → **API**
2. Click **Generate API Key**
3. Copy the key (it's a UUID format)

### 3. Add to Vercel

In your Vercel project → **Settings** → **Environment Variables**:

| Key | Value | Example |
|-----|-------|---------|
| `ZAPRITE_API_KEY` | Your API key | `a1b2c3d4-e5f6-...` |

Check all environments → **Save** → **Redeploy**.

### 4. Set Up Webhooks (Optional)

To get Telegram/Slack notifications when someone donates:

1. In Zaprite → **Settings** → **Webhooks**
2. Add a webhook URL: `https://yourdomain.com/api/webhooks/zaprite`
3. Select events: **Order Completed**
4. Save

This sends payment data to your site, which forwards a formatted notification to your Telegram group or Slack channel.

## How Donations Work

1. Visitor picks an amount on `/donate`
2. Your site creates a Zaprite checkout order via the API
3. Visitor is redirected to Zaprite's hosted checkout page
4. They pay with their preferred method
5. After payment, they're redirected to `/donate/thank-you`
6. You get a notification (if Telegram/Slack is set up)

