/* Shared by the checkout, webhook, session and stats endpoints. */

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

export const MAX_ASK = 524288;
export const validAmount = a => Number.isInteger(a) && a >= 1 && a <= MAX_ASK && (a & (a - 1)) === 0;

/* Ledger names are public, so: short, single-line, no links, no handles,
   nothing on the blocklist. Anything doubtful becomes Anonymous. */
export function cleanName(raw, env = {}){
  let s = String(raw || '').normalize('NFKC').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, '');
  s = s.replace(/\s+/g, ' ').trim().slice(0, 46);
  if (!s) return 'Anonymous';
  if (/(https?:|www\.|\.(com|net|org|io|co|xyz|ru|ly|gg|me|app|dev|ai)\b|@\w)/i.test(s)) return 'Anonymous';
  const blocked = String(env.BLOCKED_WORDS || '').toLowerCase().split(',').map(w => w.trim()).filter(Boolean);
  const low = s.toLowerCase();
  if (blocked.some(w => low.includes(w))) return 'Anonymous';
  return s;
}

/* Idempotent: the same Checkout Session is only ever recorded once. */
export async function recordSession(env, session){
  if (!session || session.payment_status !== 'paid') return null;
  const name = cleanName(session.metadata?.ledger_name, env);
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null;
  await env.DB.prepare(
    `INSERT OR IGNORE INTO gifts (session_id, payment_intent, amount_cents, currency, name)
     VALUES (?1, ?2, ?3, ?4, ?5)`
  ).bind(session.id, pi, session.amount_total, session.currency || 'usd', name).run();
  return env.DB.prepare('SELECT id, name, amount_cents, created_at FROM gifts WHERE session_id = ?1')
    .bind(session.id).first();
}
