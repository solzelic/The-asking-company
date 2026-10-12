/* The Worker. Static files come from the assets binding; these routes
   run first. Each handler lives in functions/, in the same shape as a
   Pages Function, so either deployment style works. */
import * as checkout from '../functions/api/checkout.js';
import * as webhook from '../functions/api/webhook.js';
import * as session from '../functions/api/session.js';
import * as stats from '../functions/api/stats.js';
import * as subscribe from '../functions/api/subscribe.js';
import * as og from '../functions/og/[slug].js';

const ROUTES = [
  ['POST', /^\/api\/checkout$/, checkout.onRequestPost],
  ['POST', /^\/api\/webhook$/, webhook.onRequestPost],
  ['GET',  /^\/api\/session$/, session.onRequestGet],
  ['GET',  /^\/api\/stats$/, stats.onRequestGet],
  ['POST', /^\/api\/subscribe$/, subscribe.onRequestPost],
  ['GET',  /^\/og\/([A-Za-z0-9_-]+)(?:\.png)?$/, og.onRequestGet, 'slug'],
];

export default {
  async fetch(request, env, ctx){
    const url = new URL(request.url);
    for (const [method, re, handler, param] of ROUTES){
      const m = url.pathname.match(re);
      if (!m) continue;
      if (request.method !== method) return new Response('Method not allowed', { status: 405 });
      const params = param ? { [param]: m[1] } : {};
      try { return await handler({ request, env, params, waitUntil: ctx.waitUntil.bind(ctx) }); }
      catch (e) { console.error(e); return new Response(JSON.stringify({ error: 'Something went wrong on our side.' }), { status: 500, headers: { 'Content-Type': 'application/json' } }); }
    }
    return env.ASSETS.fetch(request);
  },
};
