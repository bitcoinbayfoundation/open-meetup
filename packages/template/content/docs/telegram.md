# Telegram

Telegram sends you instant notifications when someone submits the contact form or makes a donation. Free, fast, and takes about 2 minutes to set up.

**Recommended.** Without notifications, contact form submissions still process (added to newsletter if Resend is configured) but you won't know about them in real-time.

## What It Powers

- **Contact form alerts** — name, email, and message delivered to your Telegram group
- **Donation alerts** — amount, customer, payment method, and order link when a Zaprite payment is confirmed

## Setup

### 1. Create a Bot with @BotFather

1. Open Telegram and search for **@BotFather** (or go to [t.me/BotFather](https://t.me/BotFather))
2. Send `/newbot`
3. Choose a **name** for your bot (e.g., "Austin Bitcoin Alerts")
4. Choose a **username** — must end in `bot` (e.g., `austin_btc_alerts_bot`)
5. BotFather replies with your **bot token**:
   ```
   123456789:ABCdefGhIjKlmNoPqRsTuVwXyZ
   ```
6. Save this token — you'll need it in step 3

### 2. Get Your Chat ID

You need the ID of the chat where notifications should go.

**Easiest method — @RawDataBot:**

1. Create a Telegram group for your team notifications (or use an existing one)
2. Add **@RawDataBot** to the group
3. It immediately posts a message showing the chat info — look for `"id": -100xxxxxxxxxx`
4. That negative number is your **chat ID**
5. Remove @RawDataBot from the group (it's only needed once)

**Alternative — @userinfobot:**

1. Add **@userinfobot** to your group
2. It replies with the chat ID
3. Remove it after

**For DMs with the bot (no group):**

1. Message your bot directly
2. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Find `"chat":{"id":` — that's your chat ID (positive number for DMs)

### 3. Add to Vercel

In your Vercel project → **Settings** → **Environment Variables**:

| Key | Value | Example |
|-----|-------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | `123456789:ABCdef...` |
| `TELEGRAM_CHAT_ID` | Chat ID from step 2 | `-1001234567890` |

Check all environments → **Save** → **Redeploy**.

### 4. Make Sure Config is Set

Your `site.config.ts` should have:

```typescript
notifications: {
  provider: "telegram",
},
```

This is set automatically during the CLI scaffold if you chose Telegram.

### 5. Test It

Submit the contact form on your live site. You should receive a formatted message in your Telegram group within seconds.

## Slack Alternative

If your team prefers Slack:

1. Create a Slack app at [api.slack.com/apps](https://api.slack.com/apps)
2. Add the `chat:write` bot scope
3. Install to your workspace
4. Copy the **Bot User OAuth Token** (`xoxb-...`)

Add to Vercel:

| Key | Value |
|-----|-------|
| `SLACK_BOT_TOKEN` | `xoxb-xxxxxxxxxxxxx` |

Update `site.config.ts`:

```typescript
notifications: {
  provider: "slack",
  slackChannel: "website-alerts",
},
```

The notification format is the same — only the delivery channel changes.
