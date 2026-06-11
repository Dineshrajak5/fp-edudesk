// supabase/functions/send-notifications/index.ts
// Sends Web Push notifications to all subscribed users

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@faceprep.in'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── VAPID JWT signing ───────────────────────────────────
async function generateVAPIDJWT(audience: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: VAPID_SUBJECT,
  }

  const enc = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const unsigned = `${enc(header)}.${enc(payload)}`

  const keyData = VAPID_PRIVATE_KEY.replace('-----BEGIN EC PRIVATE KEY-----', '')
    .replace('-----END EC PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsigned)
  )

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${unsigned}.${sig}`
}

// ── Send single push notification ──────────────────────
async function sendPush(subscription: any, payload: string): Promise<boolean> {
  try {
    const endpoint = subscription.endpoint
    const url = new URL(endpoint)
    const audience = `${url.protocol}//${url.host}`
    const jwt = await generateVAPIDJWT(audience)

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
        'Content-Type': 'application/octet-stream',
        'TTL': '86400',
      },
      body: payload,
    })

    if (res.status === 410 || res.status === 404) {
      // Subscription expired — remove it
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint)
      return false
    }

    return res.ok
  } catch (err) {
    console.error('Push send error:', err)
    return false
  }
}

// ── Main handler ────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { count, articles } = await req.json()
  if (!count || count === 0) {
    return new Response(JSON.stringify({ message: 'Nothing to notify' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Get all subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')

  if (error || !subscriptions?.length) {
    console.log('No subscriptions found')
    return new Response(JSON.stringify({ message: 'No subscribers' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const topArticle = articles?.[0]
  const notificationPayload = JSON.stringify({
    title: 'FP EduDesk',
    body: topArticle
      ? `${topArticle.title}`
      : `${count} new education articles`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: {
      url: topArticle?.url || '/',
      count,
    },
    tag: 'fp-edudesk-update',
    renotify: true,
  })

  let sent = 0
  for (const sub of subscriptions) {
    const ok = await sendPush(sub, notificationPayload)
    if (ok) sent++
  }

  console.log(`Sent ${sent}/${subscriptions.length} notifications`)

  return new Response(
    JSON.stringify({ sent, total: subscriptions.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
