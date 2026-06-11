-- ============================================================
-- FP EduDesk — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title         text NOT NULL,
  url           text UNIQUE NOT NULL,
  source        text,
  ai_summary    text,
  category      text DEFAULT 'General',
  published_at  timestamptz DEFAULT now(),
  fetched_at    timestamptz DEFAULT now(),
  image_url     text
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category  ON articles (category);
CREATE INDEX IF NOT EXISTS idx_articles_source    ON articles (source);

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint    text UNIQUE NOT NULL,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- RLS: Allow anonymous reads on articles (public feed)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read articles"
  ON articles FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS: Allow anyone to subscribe to push
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert push subscription"
  ON push_subscriptions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update own push subscription"
  ON push_subscriptions FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete own push subscription"
  ON push_subscriptions FOR DELETE
  TO anon, authenticated
  USING (true);

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role full access articles"
  ON articles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access subscriptions"
  ON push_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-clean articles older than 30 days (optional)
-- Run this as a separate cron or Supabase scheduled function
-- DELETE FROM articles WHERE fetched_at < now() - interval '30 days';
