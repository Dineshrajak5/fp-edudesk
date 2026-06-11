// supabase/functions/fetch-news/index.ts
// Deploy: supabase functions deploy fetch-news
// Schedule via Supabase Dashboard → Edge Functions → fetch-news → Cron: every 2 hours
// Cron expression: 0 */2 * * *

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── RSS Feed Sources ────────────────────────────────────
const RSS_SOURCES = [
  {
    name: 'Google News',
    url: 'https://news.google.com/rss/search?q=education+india&hl=en-IN&gl=IN&ceid=IN:en',
  },
  {
    name: 'The Hindu',
    url: 'https://www.thehindu.com/education/feeder/default.rss',
  },
  {
    name: 'Indian Express',
    url: 'https://indianexpress.com/section/education/feed/',
  },
  {
    name: 'NDTV',
    url: 'https://feeds.feedburner.com/ndtvnews-education',
  },
  {
    name: 'Careers360',
    url: 'https://news.careers360.com/rss',
  },
  {
    name: 'Times of India',
    url: 'https://timesofindia.indiatimes.com/rssfeeds/913168846.cms',
  },
]

// ── Parse RSS ───────────────────────────────────────────
async function fetchRSS(source: { name: string; url: string }) {
  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'FPEduDesk/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    return parseRSS(xml, source.name)
  } catch (err) {
    console.error(`Failed to fetch ${source.name}:`, err)
    return []
  }
}

function parseRSS(xml: string, sourceName: string) {
  const items: any[] = []
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

  for (const item of itemMatches.slice(0, 15)) {
    const title = stripCDATA(extractTag(item, 'title'))
    const link = extractTag(item, 'link') || extractTag(item, 'guid')
    const description = stripHTML(stripCDATA(extractTag(item, 'description')))
    const pubDate = extractTag(item, 'pubDate')

    if (!title || !link) continue

    // Filter for India-relevance (Google News already filtered, others may need it)
    const combined = (title + ' ' + description).toLowerCase()
    const indiaTerms = ['india', 'indian', 'ugc', 'aicte', 'nep', 'cbse', 'ncert',
      'jee', 'neet', 'iit', 'iim', 'nit', 'upsc', 'mhrd', 'education ministry',
      'university', 'college', 'school', 'student', 'curriculum', 'exam']
    const isRelevant = sourceName === 'Google News' ||
      indiaTerms.some(t => combined.includes(t))
    if (!isRelevant) continue

    items.push({
      title: title.trim(),
      url: link.trim(),
      description: description?.slice(0, 500) || '',
      source: sourceName,
      published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    })
  }
  return items
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'))
  return match ? match[1].trim() : ''
}

function stripCDATA(str: string): string {
  return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function stripHTML(str: string): string {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── Gemini Summary + Category ───────────────────────────
async function generateSummary(title: string, description: string): Promise<{
  summary: string;
  category: string;
}> {
  const prompt = `You are a news editor for an Indian education sector news app used by professionals at an edtech company.

Article Title: ${title}
Article Description: ${description || 'Not available'}

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "summary": "2-sentence plain English summary for a busy professional. Direct and factual.",
  "category": "one of: Policy | Exams | Higher Ed | EdTech | Schools | General"
}`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 200 },
        }),
        signal: AbortSignal.timeout(10000),
      }
    )

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return {
      summary: parsed.summary || '',
      category: parsed.category || 'General',
    }
  } catch (err) {
    console.error('Gemini error:', err)
    return { summary: '', category: 'General' }
  }
}

// ── Check existing URLs ─────────────────────────────────
async function getExistingUrls(urls: string[]): Promise<Set<string>> {
  const { data } = await supabase
    .from('articles')
    .select('url')
    .in('url', urls)
  return new Set((data || []).map((r: any) => r.url))
}

// ── Main handler ────────────────────────────────────────
Deno.serve(async (req) => {
  // Allow manual trigger via POST + cron invocation
  const authHeader = req.headers.get('Authorization')
  if (req.method !== 'POST' && !authHeader?.includes('Bearer')) {
    return new Response('Method not allowed', { status: 405 })
  }

  console.log('FP EduDesk: Starting news fetch...')
  const newArticles: any[] = []

  // Fetch all RSS sources in parallel
  const allFetched = (await Promise.all(RSS_SOURCES.map(fetchRSS))).flat()
  console.log(`Fetched ${allFetched.length} raw articles`)

  if (allFetched.length === 0) {
    return new Response(JSON.stringify({ message: 'No articles fetched', new: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Deduplicate by URL within this batch
  const seen = new Set<string>()
  const dedupedBatch = allFetched.filter(a => {
    if (seen.has(a.url)) return false
    seen.add(a.url)
    return true
  })

  // Check against DB
  const existingUrls = await getExistingUrls(dedupedBatch.map(a => a.url))
  const freshArticles = dedupedBatch.filter(a => !existingUrls.has(a.url))
  console.log(`${freshArticles.length} new articles to process`)

  // Process with Gemini (rate limit: process max 30 per run)
  const toProcess = freshArticles.slice(0, 30)

  for (const article of toProcess) {
    const { summary, category } = await generateSummary(article.title, article.description)
    newArticles.push({
      title: article.title,
      url: article.url,
      source: article.source,
      ai_summary: summary,
      category,
      published_at: article.published_at,
      fetched_at: new Date().toISOString(),
    })
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100))
  }

  if (newArticles.length > 0) {
    const { error } = await supabase.from('articles').insert(newArticles)
    if (error) {
      console.error('Insert error:', error)
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
    console.log(`Stored ${newArticles.length} new articles`)

    // Trigger push notifications
    await fetch(`${SUPABASE_URL}/functions/v1/send-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ count: newArticles.length, articles: newArticles.slice(0, 3) }),
    })
  }

  return new Response(
    JSON.stringify({ message: 'Done', new: newArticles.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
