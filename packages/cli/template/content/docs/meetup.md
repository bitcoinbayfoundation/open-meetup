# Meetup.com

The Meetup.com integration syncs events between your site and your Meetup group — import events, track RSVPs, and cross-post between platforms.

**Optional.** Your site's events page works perfectly without this. Events are managed through the admin panel at `/admin/events`. This integration is for groups that already have a Meetup.com presence and want events to appear on both platforms.

## What It Powers

- **Event import** — pull events from your Meetup group into your site
- **Event sync** — keep event details in sync across platforms
- **RSVP tracking** — import RSVP counts from Meetup
- **Admin panel** — manage sync from `/admin/meetup`

## Setup

Meetup uses OAuth2 for API access. This requires registering an app and authorizing it.

> A future update will add an admin page at `/admin/meetup/auth` that handles the token exchange flow automatically. For now, follow these manual steps.

### 1. Register an OAuth Consumer

1. Log in to Meetup.com
2. Go to [meetup.com/api/oauth/list](https://www.meetup.com/api/oauth/list/)
3. Click **Register a new OAuth Consumer**
4. Fill in:
   - **Consumer Name**: your meetup name (e.g., "Austin Bitcoin Website")
   - **Application Website**: `https://yourdomain.com`
   - **Redirect URI**: `https://yourdomain.com/admin/meetup`
5. Submit and note your **Client ID** (Key) and **Client Secret**

### 2. Authorize Your App

Open this URL in your browser (replace the values):

```
https://secure.meetup.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://yourdomain.com/admin/meetup&scope=event_management
```

Click **Allow** when Meetup asks for permission.

You'll be redirected to your redirect URI with a `?code=` parameter in the URL. Copy that code — you need it for the next step.

### 3. Exchange Code for Tokens

Run this in your terminal (replace all placeholder values):

```bash
curl -X POST https://secure.meetup.com/oauth2/access \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=https://yourdomain.com/admin/meetup" \
  -d "code=THE_CODE_FROM_STEP_2"
```

The response looks like:

```json
{
  "access_token": "xxxxxxxx",
  "refresh_token": "yyyyyyyy",
  "token_type": "bearer",
  "expires_in": 3600
}
```

Save both the `access_token` and `refresh_token`.

### 4. Add to Vercel

In your Vercel project → **Settings** → **Environment Variables**:

| Key | Value |
|-----|-------|
| `MEETUP_CLIENT_ID` | Your client ID from step 1 |
| `MEETUP_CLIENT_SECRET` | Your client secret from step 1 |
| `MEETUP_OAUTH_TOKEN` | `access_token` from step 3 |
| `MEETUP_OAUTH_REFRESH_TOKEN` | `refresh_token` from step 3 |

Check all environments → **Save** → **Redeploy**.

### 5. Configure in site.config.ts

Set your Meetup group slug — the part after `meetup.com/` in your group's URL:

```typescript
meetup: {
  groupSlug: "your-bitcoin-meetup",
},
```

For example, if your group is at `meetup.com/austin-bitcoin`, the slug is `austin-bitcoin`.

## Token Refresh

Meetup access tokens expire after 1 hour. The integration automatically refreshes them using the refresh token. You don't need to do anything — it handles this silently.

If both tokens expire (e.g., your site was down for a long time), you'll need to repeat steps 2-4 to get fresh tokens.

## Without Meetup

If you don't use Meetup.com:
- Don't set the environment variables
- Remove or omit the `meetup` block from `site.config.ts`
- Events are managed entirely through `/admin/events`
- Meetup links won't appear anywhere on the site
