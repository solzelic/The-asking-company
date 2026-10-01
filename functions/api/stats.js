/* GET /api/stats — the counter and the top of the ledger. Cached briefly. */
import { json } from '../_lib/gifts.js';

export async function onRequestGet({ env }){
  const [sum, top] = await env.DB.batch([
    env.DB.prepare('SELECT COALESCE(SUM(amount_cents), 0) AS cents, COUNT(*) AS n FROM gifts WHERE refunded = 0'),
    env.DB.prepare(`SELECT name, amount_cents FROM gifts WHERE refunded = 0 AND hidden = 0
                    ORDER BY amount_cents DESC, id ASC LIMIT 15`),
  ]);
  const s = sum.results[0] || { cents: 0, n: 0 };
  return json({
    total: Math.round(s.cents / 100),
    givers: s.n,
    ledger: top.results.map(r => ({ name: r.name, amount: Math.round(r.amount_cents / 100) })),
  }, 200, { 'Cache-Control': 'public, max-age=15' });
}
