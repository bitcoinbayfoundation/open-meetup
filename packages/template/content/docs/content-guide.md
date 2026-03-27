# Content Guide

All site content is managed through a combination of **content files** (markdown/JSON) and the **admin panel** (database-backed).

## Content Files

These live in the `content/` directory and are read at build time:

### About Page — `content/about.md`

Write your organization's story in markdown. Each paragraph (separated by blank lines) gets its own styled block on the about page.

```markdown
We're a group of bitcoiners in Austin, Texas who believe sound money education should be free and accessible to everyone.

Our mission is to build a thriving Bitcoin community through regular meetups, workshops, and community events.

Founded in 2024, we've grown from a small group to hosting multiple events every month.
```

If the file is empty, the about page shows a placeholder prompting you to add content.

### FAQs — `content/faqs.json`

FAQs are organized by page. Each page key maps to an array of question/answer pairs:

```json
{
  "home": [
    {
      "question": "What is Austin Bitcoin?",
      "answer": "We're a 501(c)(3) nonprofit..."
    }
  ],
  "about": [],
  "donate": [
    {
      "question": "Is my donation tax deductible?",
      "answer": "Yes! We are a registered 501(c)(3)..."
    }
  ],
  "education": []
}
```

Pages with empty FAQ arrays simply don't show an FAQ section — no errors, no placeholders.

### Donation Tiers — `content/donation-tiers.json`

Recurring donation membership tiers displayed on the donate page:

```json
[
  {
    "name": "Supporter",
    "range": "$10 - $24/month",
    "description": "Help us keep the lights on.",
  }
]
```

If the array is empty, the membership tiers section is hidden. The quick donate (one-time via Zaprite) still works independently.


## Admin Panel Content

These are managed through the admin dashboard at `/admin`:

### Posts (Blog)

Full blog CMS with:
- Rich markdown editor
- Featured images (drag-and-drop upload)
- Tags for categorization
- Draft/published status
- Scheduled publishing
- SEO fields (meta title, description, OG image)
- Auto-generated slugs

### Events

Event management with:
- Title, description, date/time, venue
- Featured image
- Free/paid toggle with price field
- Draft/published status
- Optional Meetup.com sync (if configured)
- RSVP tracking

### Resources (Education)

Curated resource library with categories:
- Documentaries, Books, Articles, Websites, Podcasts
- Each resource has a title, URL, description, author, and image
- Featured flag for pinning top resources
- Tag support

### Media

Media library backed by Vercel Blob storage:
- Drag-and-drop image uploads
- Folder organization
- Used across posts, events, and the photo gallery
- Requires `BLOB_READ_WRITE_TOKEN` environment variable

### Newsletter

Subscriber management via Resend:
- View subscribers
- Create contact groups
- Manage group membership
- Requires `RESEND_API_KEY` and `RESEND_AUDIENCE_ID`
