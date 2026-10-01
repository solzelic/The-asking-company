/* POST /api/webhook — Stripe tells us what happened.
   Subscribe the endpoint to: checkout.session.completed,
   checkout.session.async_payment_succeeded, charge.refunded,
   charge.dispute.created. */
import { verifyWebhook } from '../_lib/stripe.js';
import { json, recordSession } from '../_lib/gifts.js';

export async function onRequestPost({ request, env }){
  const raw = await request.text();
  const event = await verifyWebhook(env, raw, request.headers.get('Stripe-Signature'));
  if (!event) return json({ error: 'Invalid signature' }, 400);

  const obj = event.data?.object || {};
  switch (event.type){
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await recordSession(env, obj);
      break;
    case 'charge.refunded':
    case 'charge.dispute.created': {
      const pi = obj.payment_intent;
      if (pi) await env.DB.prepare('UPDATE gifts SET refunded = 1 WHERE payment_intent = ?1').bind(pi).run();
      break;
    }
  }
  return json({ received: true });
}
