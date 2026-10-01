/* POST /api/checkout  { amount, name, lang } → { url }
   Creates a Stripe Checkout Session for one Certificate of Nothing. */
import { stripe } from '../_lib/stripe.js';
import { json, validAmount, cleanName } from '../_lib/gifts.js';

// Languages Stripe Checkout can display. Anything else gets 'auto'.
const STRIPE_LOCALES = new Set(['bg', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'fi', 'fil', 'fr', 'hr', 'hu', 'id',
  'it', 'ja', 'ko', 'lt', 'lv', 'ms', 'mt', 'nb', 'nl', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sv', 'th', 'tr', 'vi', 'zh']);

export async function onRequestPost({ request, env }){
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request.' }, 400); }

  const amount = Number(body.amount);
  if (!validAmount(amount)) return json({ error: 'We only ask for powers of two.' }, 400);
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Payments are not switched on yet. No money moved.' }, 503);

  const name = cleanName(body.name, env);
  const origin = new URL(request.url).origin;
  const lang = String(body.lang || '').toLowerCase();

  try {
    const session = await stripe(env, 'POST', 'checkout/sessions', {
      mode: 'payment',
      submit_type: 'pay',
      locale: STRIPE_LOCALES.has(lang) ? lang : 'auto',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: env.CURRENCY || 'usd',
          unit_amount: amount * 100,
          product_data: {
            name: 'Certificate of Nothing',
            description: `A digital certificate recording that you gave $${amount.toLocaleString('en-US')} to Asking Company and received nothing else. Delivered on screen immediately.`,
          },
        },
      }],
      metadata: { ledger_name: name, amount: String(amount) },
      payment_intent_data: {
        description: `Certificate of Nothing ($${amount})`,
        metadata: { ledger_name: name },
      },
      success_url: `${origin}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?declined=1`,
    });
    return json({ url: session.url });
  } catch (e) {
    console.error('checkout failed', e);
    return json({ error: 'Something went wrong on our side. No money moved.' }, 502);
  }
}
