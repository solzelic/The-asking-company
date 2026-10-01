/* GET /api/session?id=cs_… — called by /thanks after Stripe redirects back.
   Confirms the payment with Stripe directly (so the certificate never
   waits on the webhook) and returns what the certificate needs. */
import { stripe } from '../_lib/stripe.js';
import { json, recordSession } from '../_lib/gifts.js';

export async function onRequestGet({ request, env }){
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) return json({ error: 'Unknown session.' }, 400);

  let session;
  try { session = await stripe(env, 'GET', `checkout/sessions/${id}`); }
  catch { return json({ error: 'Unknown session.' }, 404); }

  if (session.payment_status !== 'paid') return json({ status: 'pending' }, 202);

  const row = await recordSession(env, session);
  if (!row) return json({ status: 'pending' }, 202);
  return json({
    status: 'paid',
    giver: row.id,
    name: row.name,
    amount: Math.round(row.amount_cents / 100),
    date: row.created_at,
  });
}
