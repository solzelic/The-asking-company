/* POST /api/subscribe { email, writings, billion, source }
   Stores the address. Sending is done by hand (or by whatever mail
   service you later point at this table) — see README. */
import { json } from '../_lib/gifts.js';

export async function onRequestPost({ request, env }){
  let b;
  try { b = await request.json(); } catch { return json({ error: 'Bad request.' }, 400); }
  const email = String(b.email || '').trim().toLowerCase().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'That is not an email address.' }, 400);
  await env.DB.prepare(
    `INSERT INTO subscribers (email, writings, billion, source) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT(email) DO UPDATE SET writings = MAX(writings, excluded.writings), billion = MAX(billion, excluded.billion)`
  ).bind(email, b.writings ? 1 : 0, b.billion ? 1 : 0, String(b.source || '').slice(0, 40)).run();
  return json({ ok: true });
}
