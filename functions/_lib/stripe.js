/* A very small Stripe client: form-encoded REST calls and webhook
   signature checks, using only fetch and WebCrypto. No SDK needed. */

function encode(obj, prefix = '', out = new URLSearchParams()){
  for (const [k, v] of Object.entries(obj)){
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') encode(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

export async function stripe(env, method, path, params){
  if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
  const init = {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Stripe-Version': '2024-06-20',
    },
  };
  let url = `https://api.stripe.com/v1/${path}`;
  if (params && method === 'GET') url += '?' + encode(params);
  else if (params){
    init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    init.body = encode(params);
  }
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Stripe ${res.status}`);
  return data;
}

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

function safeEqual(a, b){
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* Returns the parsed event, or null if the signature is bad or stale. */
export async function verifyWebhook(env, raw, header, toleranceSec = 300){
  if (!env.STRIPE_WEBHOOK_SECRET || !header) return null;
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')).filter(p => p.length === 2 && p[0] !== 'v1'));
  const sigs = header.split(',').filter(p => p.startsWith('v1=')).map(p => p.slice(3));
  const t = Number(parts.t);
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - t) > toleranceSec) return null;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${raw}`)));
  if (!sigs.some(s => safeEqual(s, expected))) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
