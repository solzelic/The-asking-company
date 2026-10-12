/* Shared by the checkout, webhook, session and stats endpoints. */

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

/* Until the D1 database is bound, every endpoint that needs it says so. */
export const noDB = env => !env.DB && json({ error: 'The ledger is not switched on yet.' }, 503);

/* The schema, applied on first use so a fresh database just works.
   Same SQL as migrations/; CREATE IF NOT EXISTS makes it harmless to repeat. */
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS gifts (
     id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT UNIQUE, payment_intent TEXT,
     amount_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'usd',
     name TEXT NOT NULL DEFAULT 'Anonymous', hidden INTEGER NOT NULL DEFAULT 0,
     refunded INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE INDEX IF NOT EXISTS gifts_by_amount ON gifts (refunded, hidden, amount_cents DESC)`,
  `CREATE INDEX IF NOT EXISTS gifts_by_pi ON gifts (payment_intent)`,
  `CREATE TABLE IF NOT EXISTS subscribers (
     email TEXT PRIMARY KEY, writings INTEGER NOT NULL DEFAULT 1, billion INTEGER NOT NULL DEFAULT 1,
     source TEXT, series TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT (datetime('now')))`,
];
/* The fifteen givers from before Stripe (Q1 2026, $149): giver numbers 1–15. */
const SEED = [[5000,'a man who lost a bet'],[2500,'a man who says he runs an AI lab'],[2000,"someone's wife (didn't ask)"],
  [1500,'guy from the airport bar'],[1000,'the estate of a dead oil baron'],[700,'a man who is 47 but insists he is 18'],
  [500,'a lurker, finally'],[500,'a guy with a blog'],[300,'my uber driver'],[200,'a fellow founder'],
  [200,'mom (not the one above)'],[200,'someone who clicked twice'],[100,'Anonymous'],[100,'Anonymous'],[100,'a child who stole the iPad']];
let readyOnce = null;
export function ready(env){
  if (!readyOnce) readyOnce = (async () => {
    await env.DB.batch(SCHEMA.map(q => env.DB.prepare(q)));
    const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM gifts').first();
    if (n === 0) await env.DB.batch(SEED.map(([c, name]) =>
      env.DB.prepare("INSERT INTO gifts (amount_cents, name, created_at) VALUES (?1, ?2, '2026-04-30 00:00:00')").bind(c, name)));
  })().catch(e => { readyOnce = null; throw e; });
  return readyOnce;
}

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
