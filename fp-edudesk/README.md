# FP EduDesk — Setup Guide

India Education News PWA for FACE Prep Team.

---

## What You're Getting

- News feed from 6 Indian education sources (Google News, The Hindu, Indian Express, NDTV, Careers360, Times of India)
- AI-generated 2-sentence summaries per article (Gemini 2.0 Flash)
- Category tags: Policy, Exams, Higher Ed, EdTech, Schools
- Push notifications every 2 hours when new articles arrive
- Installable PWA (Android, iOS, Desktop)
- Offline access to cached articles
- Filter by category, source, search

---

## Step 1 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project → Name it `fp-edudesk`
2. Once created, go to **SQL Editor** → **New Query**
3. Paste the contents of `supabase/schema.sql` and run it
4. Go to **Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → for Edge Function secrets

---

## Step 2 — Generate VAPID Keys (for Push Notifications)

Run this once (Node.js required):

```bash
npx web-push generate-vapid-keys
```

This gives you a `Public Key` and `Private Key`. Save both.

---

## Step 3 — Get Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API Key** → Create API Key
3. Copy the key

---

## Step 4 — Deploy Edge Functions

Install Supabase CLI if you haven't:
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-id
```

Set secrets:
```bash
supabase secrets set GEMINI_API_KEY=your-gemini-key
supabase secrets set VAPID_PUBLIC_KEY=your-vapid-public-key
supabase secrets set VAPID_PRIVATE_KEY=your-vapid-private-key
supabase secrets set VAPID_SUBJECT=mailto:your@email.com
```

Deploy functions:
```bash
supabase functions deploy fetch-news
supabase functions deploy send-notifications
```

---

## Step 5 — Schedule the Cron Job (Every 2 Hours)

In Supabase Dashboard:
1. Go to **Edge Functions → fetch-news**
2. Click **Schedule**
3. Cron expression: `0 */2 * * *`
4. This runs fetch-news every 2 hours automatically

---

## Step 6 — Deploy Frontend to Vercel

1. Push the project to GitHub
2. Go to [vercel.com](https://vercel.com) → Import repository
3. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
   ```
4. Deploy → Your app will be live at `fp-edudesk.vercel.app`

---

## Step 7 — First Run

To immediately populate the feed (don't wait for the first cron):

1. In Supabase Dashboard → **Edge Functions → fetch-news**
2. Click **Invoke** (or send a POST request with your service key)

Within ~2 minutes you'll have articles with AI summaries.

---

## Install as PWA

**Android:** Open in Chrome → Menu → "Add to Home Screen"
**iOS:** Open in Safari → Share → "Add to Home Screen"
**Desktop:** Chrome address bar → install icon on the right

---

## File Structure

```
fp-edudesk/
├── src/
│   ├── components/
│   │   ├── ArticleCard.jsx      ← News card with AI summary + source link
│   │   ├── FilterBar.jsx        ← Category/source/search filters
│   │   └── Header.jsx           ← App header with notification toggle
│   ├── hooks/
│   │   └── useArticles.js       ← Supabase data fetching hook
│   ├── lib/
│   │   ├── supabase.js          ← Supabase client
│   │   └── notifications.js     ← Push notification helpers
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── supabase/
│   ├── functions/
│   │   ├── fetch-news/          ← RSS fetch + Gemini summary + store
│   │   └── send-notifications/  ← Web Push to all subscribers
│   └── schema.sql               ← Run this first in Supabase SQL Editor
├── .env.example                 ← Copy to .env and fill in values
├── vite.config.js
└── vercel.json
```

---

## Troubleshooting

**No articles showing?**
→ Check if Edge Function ran (Supabase → Edge Functions → Logs)
→ Make sure GEMINI_API_KEY secret is set

**Notifications not working?**
→ Check VAPID keys are correct (public key must match in both .env and Edge Function secrets)
→ iOS Safari requires iOS 16.4+ for Web Push

**RSS feeds failing?**
→ Some feeds may change URLs. Check Edge Function logs for which source failed.
→ Google News RSS is the most reliable fallback.
