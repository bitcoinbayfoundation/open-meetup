# Google Maps

The Bitcoin merchant map at `/map` shows Bitcoin-accepting businesses near your city. It uses **BTC Map** for data (free, works out of the box) and optionally **Google Maps** for an interactive map overlay.

**Optional.** The map page works without a Google Maps key. The default list view fetches live data from BTC Map's free API — no key needed. Google Maps only enables the "show map" button for a visual map overlay.

## How the Map Works

[BTC Map](https://btcmap.org) is a free, open-source project that maps Bitcoin-accepting businesses worldwide. Your site fetches data from their API using the `mapCenter` coordinates in your config (automatically set during CLI setup from your city/state).

Category counts on the homepage "Shop with Bitcoin" section are also live from BTC Map — they load when the section scrolls into view.

## Adding Google Maps (Optional)

### 1. Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Click **Select a Project** → **New Project**
3. Name it (e.g., `meetup-website`) → **Create**

> **Google Docs:** [cloud.google.com/resource-manager/docs/creating-managing-projects](https://cloud.google.com/resource-manager/docs/creating-managing-projects)

### 2. Enable the Maps JavaScript API

1. In Google Cloud Console → **APIs & Services** → **Library**
2. Search for **Maps JavaScript API**
3. Click it → **Enable**

### 3. Create an API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the key (starts with `AIza`)

### 4. Restrict the Key

This is important for security — without restrictions, anyone could use your key.

1. Click on the API key you just created → **Edit**
2. Under **Application restrictions** → select **HTTP referrers (websites)**
3. Add your domains:
   - `yourmeetup.org/*`
   - `*.vercel.app/*` (for preview deployments)
   - `localhost:3000/*` (for local dev)
4. Under **API restrictions** → select **Restrict key** → check **Maps JavaScript API**
5. **Save**

### 5. Add to Vercel

In your Vercel project → **Settings** → **Environment Variables**:

| Key | Value | Example |
|-----|-------|---------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Your API key | `AIzaSy...` |

The `NEXT_PUBLIC_` prefix means this key is sent to the browser. This is normal for Google Maps — the domain restriction in step 4 protects it.

Check all environments → **Save** → **Redeploy**.

## Cost

Google Maps JavaScript API includes **$200/month in free credit** (~28,000 map loads per month). Most meetup sites won't come close to this.

Set up billing alerts in Google Cloud Console → **Billing** → **Budgets & Alerts** to be safe.

## Map Center

The search center for BTC Map is in `site.config.ts`:

```typescript
location: {
  mapCenter: { lat: 30.2672, lng: -97.7431 },
},
```

This was automatically geocoded from your city and state during CLI setup. To change it, update the coordinates.
