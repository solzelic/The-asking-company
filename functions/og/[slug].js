/* GET /og/<slug>.png — the link preview for an essay: its cover, large.
   Drawn on the edge from /og-data.json (written at build) and cached. */
import { ImageResponse, loadGoogleFont } from 'workers-og';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function onRequestGet({ request, env, params }){
  const slug = String(params.slug || '').replace(/\.png$/, '');
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;

  const data = await env.ASSETS.fetch(new URL('/og-data.json', request.url)).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  const b = data[slug];
  if (!b) return new Response('Not found', { status: 404 });

  const [serif, sans] = await Promise.all([
    loadGoogleFont({ family: 'Newsreader', weight: 500 }),
    loadGoogleFont({ family: 'Inter', weight: 600 }),
  ]);
  const html = `
  <div style="display: flex; width: 1200px; height: 630px; background: #14110c; align-items: center; justify-content: center; font-family: Inter">
    <div style="display: flex; width: 1100px; height: 530px; background: ${esc(b.cloth)}; color: ${esc(b.ink)}; border-radius: 6px; padding: 56px 64px; flex-direction: column; justify-content: space-between; box-shadow: 0 40px 90px rgba(0,0,0,.6)">
      <div style="display: flex; justify-content: space-between; font-size: 22px; letter-spacing: 4px; text-transform: uppercase; opacity: .85">
        <span>${esc(b.series)}</span><span>No. ${esc(b.no)}</span>
      </div>
      <div style="display: flex; flex-direction: column">
        <div style="display: flex; width: 120px; height: 4px; background: ${esc(b.ink)}; opacity: .8; margin-bottom: 28px"></div>
        <div style="display: flex; font-family: Newsreader; font-size: ${b.title.length > 40 ? 64 : 80}px; line-height: 1.02; letter-spacing: -2px">${esc(b.title)}</div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 22px; letter-spacing: 4px; text-transform: uppercase; opacity: .85">
        <span>Asking Company · The Library</span><span>${esc(b.date)} · ${esc(b.minutes)} min</span>
      </div>
    </div>
  </div>`; 
  // Every div needs an explicit display: flex, and whitespace between tags counts as a child.
  const res = new ImageResponse(html.replace(/>\s+</g, '><').trim(), {
    width: 1200, height: 630,
    fonts: [{ name: 'Newsreader', data: serif, weight: 500, style: 'normal' }, { name: 'Inter', data: sans, weight: 600, style: 'normal' }],
  });
  res.headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');
  await cache.put(request, res.clone());
  return res;
}
