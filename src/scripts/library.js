/* ══════════════════════════════════════════════════════════
   THE LIBRARY — filters, motion, the catalogue card.
   Books are real links; everything here is enhancement.
   ══════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(hover: none)').matches;

const room = $('room'), stacks = $('stacks'), card = $('ccard'), controls = $('controls');
const books = $$('.bk', stacks);
books.forEach((b, i) => { b.dataset.order = String(i); });
const real = books.filter(b => !b.hasAttribute('data-planned'));
const cases = Object.fromEntries($$('[data-case]').map(c => [c.dataset.case, c]));
const groups = $$('.sgroup');
const rows = $$('.irow');
const rowFor = Object.fromEntries(rows.map(r => [r.dataset.for, r]));

/* ── state, mirrored in the URL so a filtered shelf can be linked ── */
const S = { q: '', voice: 'all', shelf: 'all', tags: new Set(), sort: 'shelf', view: 'shelf', planned: true };
/* Full-text hits from Pagefind for the current query: slug → result, or null while title-only. */
let hits = null;

function readURL(){
  const p = new URLSearchParams(location.search);
  S.q = p.get('q') || '';
  S.voice = ['company', 'own'].includes(p.get('voice')) ? p.get('voice') : 'all';
  S.shelf = p.get('shelf') || 'all';
  S.tags = new Set((p.get('tag') || '').split(',').filter(Boolean));
  S.sort = p.get('sort') || 'shelf';
  S.view = p.get('view') === 'index' ? 'index' : 'shelf';
  S.planned = p.get('planned') !== '0';
}
function writeURL(){
  const p = new URLSearchParams();
  if (S.q) p.set('q', S.q);
  if (S.voice !== 'all') p.set('voice', S.voice);
  if (S.shelf !== 'all') p.set('shelf', S.shelf);
  if (S.tags.size) p.set('tag', [...S.tags].join(','));
  if (S.sort !== 'shelf') p.set('sort', S.sort);
  if (S.view !== 'shelf') p.set('view', S.view);
  if (!S.planned) p.set('planned', '0');
  const qs = p.toString();
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
}

const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function matches(el){
  const d = el.dataset;
  const planned = el.hasAttribute('data-planned');
  if (S.shelf !== 'all' && d.series !== S.shelf) return false;
  if (S.q){
    const hay = norm([d.title, d.dek, d.tags, d.seriesName].join(' '));
    const titleHit = norm(S.q).split(/\s+/).every(w => hay.includes(w));
    const textHit = !!(hits && d.slug && hits.has(d.slug));
    if (!titleHit && !textHit) return false;
  }
  if (planned) return S.planned && S.voice === 'all' && S.tags.size === 0;
  if (S.voice === 'company' && d.company !== '1') return false;
  if (S.voice === 'own' && d.company === '1') return false;
  if (S.tags.size && !(d.tags || '').split(' ').some(t => S.tags.has(t))) return false;
  return true;
}

const SORTS = {
  new: (a, b) => (b.dataset.date || '').localeCompare(a.dataset.date || ''),
  old: (a, b) => (a.dataset.date || '9').localeCompare(b.dataset.date || '9'),
  long: (a, b) => (+b.dataset.words || 0) - (+a.dataset.words || 0),
  short: (a, b) => (+a.dataset.words || 1e9) - (+b.dataset.words || 1e9),
  az: (a, b) => a.dataset.title.localeCompare(b.dataset.title),
  shelf: (a, b) => +a.dataset.order - +b.dataset.order,
};
const SORT_NAMES = { new: 'Newest first', old: 'Oldest first', long: 'Longest first', short: 'Shortest first', az: 'A – Z' };

const visible = el => !el.hidden && el.offsetParent !== null;

/* ── apply: filter, arrange, and animate the difference (FLIP) ── */
function apply(animate = true){
  animate = animate && !reduced && S.view === 'shelf';
  const before = new Map();
  if (animate) books.forEach(b => { if (visible(b)) before.set(b, b.getBoundingClientRect()); });

  const on = books.filter(matches);
  const onSet = new Set(on);

  // books that leave: a stand-in tips off the shelf where the book was
  if (animate) before.forEach((r, b) => {
    if (onSet.has(b)) return;
    const g = b.cloneNode(true);
    g.classList.remove('sel', 'nudge-l', 'nudge-r', 'enter');
    g.classList.add('ghost-out');
    g.removeAttribute('href');
    Object.assign(g.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    g.style.setProperty('--tip', (Math.random() > .5 ? 1 : -1) * (14 + Math.random() * 22) + 'deg');
    document.body.appendChild(g);
    setTimeout(() => g.remove(), 600);
  });

  books.forEach(b => { b.hidden = !onSet.has(b); b.classList.remove('sel', 'nudge-l', 'nudge-r'); });

  const flat = S.sort !== 'shelf';
  const sorted = books.slice().sort(SORTS[S.sort] || SORTS.shelf);
  if (flat){
    sorted.forEach(b => cases.__flat.appendChild(b));
  } else {
    sorted.forEach(b => cases[b.dataset.series]?.appendChild(b));
  }

  let anyGroup = false;
  groups.forEach(g => {
    const id = g.dataset.group;
    const isFlat = id === '__flat';
    const n = $$('.bk', g).filter(b => !b.hidden);
    const show = flat ? isFlat && n.length > 0 : !isFlat && n.length > 0;
    g.hidden = !show;
    anyGroup ||= show;
    const ct = g.querySelector('[data-ct]');
    if (ct){
      const w = n.filter(b => !b.hasAttribute('data-planned')).length, p = n.length - w;
      ct.textContent = (w ? w + (w === 1 ? ' volume' : ' volumes') : 'no volumes') + (p ? ' · ' + p + ' planned' : '');
    }
  });
  if (flat){
    g$('[data-flat-title]').textContent = SORT_NAMES[S.sort] || 'Everything';
    g$('[data-flat-note]').textContent = 'Every shelf at once, in one long row.';
  }
  $('emptyAll').hidden = anyGroup;

  // the index follows the same rules
  const idx = $('index');
  sorted.forEach(b => {
    const r = rowFor[b.dataset.slug || ''] || rows[+b.dataset.order];
    if (!r) return;
    r.hidden = !onSet.has(b);
    idx.appendChild(r);
  });

  if (animate){
    let k = 0;
    on.forEach(b => {
      const a = before.get(b);
      if (!a){
        b.style.setProperty('--i', String(k++));
        b.classList.remove('enter'); void b.offsetWidth; b.classList.add('enter');
        b.addEventListener('animationend', () => b.classList.remove('enter'), { once: true });
        return;
      }
      const z = b.getBoundingClientRect();
      const dx = a.left - z.left, dy = a.top - z.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      b.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }],
        { duration: 650 + Math.min(300, Math.hypot(dx, dy) * .3), easing: 'cubic-bezier(.2,1.1,.35,1)' });
    });
  }

  // controls reflect state
  $$('[data-voice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.voice === S.voice)));
  $$('[data-shelf]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.shelf === S.shelf)));
  $$('[data-tag]').forEach(b => b.setAttribute('aria-pressed', String(S.tags.has(b.dataset.tag))));
  $$('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === S.view)));
  $('sort').value = S.sort;
  $('planned').checked = S.planned;
  if ($('q').value !== S.q) $('q').value = S.q;
  stacks.classList.toggle('view-index', S.view === 'index');

  renderActive(on.filter(b => !b.hasAttribute('data-planned')).length);
  hideCard(true);
  writeURL();
}

/* the count, and a way back */
function renderActive(shown){
  const filtered = S.q || S.voice !== 'all' || S.shelf !== 'all' || S.tags.size || !S.planned;
  $('count').innerHTML = (filtered ? `${shown} of ${real.length}` : `${real.length} ${real.length === 1 ? 'volume' : 'volumes'}`) +
    (filtered ? ' <button type="button" id="clear">Clear</button>' : '');
}

const g$ = sel => document.querySelector(sel);

/* ── controls ── */
let qTimer;
$('q').addEventListener('input', e => { clearTimeout(qTimer); qTimer = setTimeout(() => { S.q = e.target.value.trim(); search(); }, 180); });

/* ── full-text search ──
   Pagefind indexes every essay at build time into small chunks, so the
   browser only downloads the pieces a query touches. Loaded on first use.
   If it is missing (dev server), search falls back to titles and summaries. */
let pf = null, pfLoad = null, searchSeq = 0;
function loadPF(){
  if (pfLoad) return pfLoad;
  pfLoad = import(/* @vite-ignore */ new URL('pagefind/pagefind.js', document.baseURI).href)
    .then(async m => { await m.init?.(); pf = m; return m; })
    .catch(() => null);
  return pfLoad;
}
const results = $('results');
async function search(){
  const q = S.q, seq = ++searchSeq;
  if (!q){ hits = null; results.innerHTML = ''; results.hidden = true; apply(); return; }
  const m = await loadPF();
  if (seq !== searchSeq) return;
  if (!m){ hits = null; results.hidden = true; apply(); return; }
  const r = await m.search(q);
  if (seq !== searchSeq) return;
  const top = await Promise.all(r.results.slice(0, 24).map(x => x.data()));
  if (seq !== searchSeq) return;
  hits = new Map();
  const slugOf = u => (u.split('?')[0].split('#')[0].replace(/\.html$/, '').replace(/\/$/, '').split('/').pop() || '');
  top.forEach(d => { const sl = slugOf(d.url); if (sl && !hits.has(sl)) hits.set(sl, d); });
  renderResults(q);
  apply();
}
function renderResults(q){
  const list = [...hits.values()];
  results.hidden = !list.length;
  results.innerHTML = list.length ? `<div class="rhd"><span>Found in the text</span><span>${list.length} ${list.length === 1 ? 'essay' : 'essays'} mention “${esc(q)}”</span></div>` +
    list.map(d => {
      const b = real.find(x => x.dataset.slug === slugOf2(d.url));
      const href = b ? b.getAttribute('href') : d.url;
      const subs = (d.sub_results || []).filter(sr => sr.anchor && sr.anchor.element !== 'h1').slice(0, 3);
      const extra = subs.map(sr => `<a class="sub" href="${esc(href + '#' + sr.anchor.id)}"><span class="st">${esc(sr.title)}</span><span class="sx">${sr.excerpt}</span></a>`).join('');
      return `<div class="hit" style="--cloth:${b ? getComputedStyle(b).getPropertyValue('--cloth') : 'var(--brass)'}">` +
        `<a class="main" href="${esc(href)}"><span class="sw"></span><span><span class="ht">${esc(d.meta?.title || '')}</span>` +
        `<span class="hx">${d.excerpt}</span></span></a>${extra ? '<div class="subs">' + extra + '</div>' : ''}</div>`;
    }).join('') : '';
}
const slugOf2 = u => (u.split('?')[0].split('#')[0].replace(/\.html$/, '').replace(/\/$/, '').split('/').pop() || '');
controls.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.id === 'clear'){ S.q = ''; S.voice = 'all'; S.shelf = 'all'; S.tags.clear(); S.planned = true; hits = null; results.innerHTML = ''; results.hidden = true; apply(); return; }
  if (t.dataset.voice){ S.voice = t.dataset.voice; apply(); }
  else if (t.dataset.shelf){ S.shelf = t.dataset.shelf; apply(); }
  else if (t.dataset.tag){ S.tags.has(t.dataset.tag) ? S.tags.delete(t.dataset.tag) : S.tags.add(t.dataset.tag); apply(); }
  else if (t.dataset.view){ S.view = t.dataset.view; apply(false); }
});

$('sort').addEventListener('change', e => { S.sort = e.target.value; apply(); });
$('planned').addEventListener('change', e => { S.planned = e.target.checked; apply(); });

/* ── the catalogue card ── */
let cardFor = null, hideT;
const seriesOf = b => document.querySelector(`[data-group="${b.dataset.series}"] h2`)?.textContent || '';
const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function showCard(b){
  clearTimeout(hideT);
  if (cardFor === b) return;
  const d = b.dataset, planned = b.hasAttribute('data-planned');
  const cs = getComputedStyle(b);
  card.innerHTML =
    `<div class="thumb${planned ? ' pl' : ''}" style="--cloth:${cs.getPropertyValue('--cloth')};--cink:${cs.getPropertyValue('--cink')}"><span>${esc(d.title)}</span></div>` +
    `<div class="body"><div class="cc-t">${esc(d.title)}</div><p class="cc-d">${esc(d.dek)}</p>` +
    (planned
      ? `<div class="cc-act"><span class="cc-meta"><span>Not yet written</span><span>${esc(seriesOf(b))}</span></span></div>`
      : `<div class="cc-act"><span class="cc-meta"><span>${esc(d.minutes)} min</span><span>${esc(d.dateLabel)}</span>${d.company === '1' ? '<span>Company letterhead</span>' : ''}</span>` +
        `<a class="cc-go" href="${b.getAttribute('href')}">Read</a></div>`) +
    `</div>`;
  card.setAttribute('aria-hidden', 'false');
  if (cardFor && !reduced){ card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap'); }
  card.classList.add('on');
  cardFor = b;
}
function hideCard(now){
  clearTimeout(hideT);
  const go = () => { card.classList.remove('on'); card.setAttribute('aria-hidden', 'true'); cardFor = null; };
  now ? go() : (hideT = setTimeout(go, 900));
}
card.addEventListener('pointerenter', () => clearTimeout(hideT));
card.addEventListener('pointerleave', () => { if (!coarse) hideCard(); });

/* neighbours lean away from the book you're looking at */
function nudge(b, on){
  const sibs = [...b.parentElement.children].filter(x => x.classList.contains('bk') && !x.hidden);
  const i = sibs.indexOf(b);
  sibs[i - 1]?.classList.toggle('nudge-l', on);
  sibs[i + 1]?.classList.toggle('nudge-r', on);
}
function select(b){
  books.forEach(x => { if (x !== b && x.classList.contains('sel')){ x.classList.remove('sel'); nudge(x, false); } });
  b.classList.add('sel'); nudge(b, true); showCard(b);
}
function deselect(){
  books.forEach(x => { if (x.classList.contains('sel')){ x.classList.remove('sel'); nudge(x, false); } });
  hideCard(true);
}

books.forEach(b => {
  if (!coarse){
    b.addEventListener('pointerenter', () => { nudge(b, true); showCard(b); });
    b.addEventListener('pointerleave', () => { nudge(b, false); hideCard(); });
  }
  b.addEventListener('focus', () => select(b));
  b.addEventListener('blur', () => { b.classList.remove('sel'); nudge(b, false); });
  if (b.hasAttribute('data-planned')){
    b.addEventListener('click', () => (b.classList.contains('sel') ? deselect() : select(b)));
    return;
  }
  // Focus lands before click, so remember whether the book was already out.
  let wasSel = false;
  b.addEventListener('pointerdown', () => { wasSel = b.classList.contains('sel'); });
  b.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    // On touch, the first tap takes the book down; the second opens it.
    if (coarse && !wasSel){ e.preventDefault(); wasSel = true; select(b); return; }
    open(b, e);
  });
});
document.addEventListener('click', e => {
  if (!e.target.closest('.bk') && !e.target.closest('.ccard')) deselect();
});
addEventListener('keydown', e => { if (e.key === 'Escape') deselect(); });

/* ── opening a book ──
   The book lifts off the shelf, flies to the centre and turns to face
   you; the cover swings open on its hinge to show the first page; the
   page grows until it is the screen — and the screen is the essay. */
const cssPx = (el, v) => parseFloat(getComputedStyle(el).getPropertyValue(v)) || 0;
let opening = false;
function open(b, e){
  e.preventDefault();
  if (opening) return;
  const href = b.getAttribute('href');
  if (reduced){ location.href = href; return; }
  opening = true;
  hideCard(true);
  const r = b.getBoundingClientRect();
  const w = cssPx(b, '--w'), h = cssPx(b, '--h'), d = cssPx(b, '--d');
  const fly = b.cloneNode(true);
  fly.classList.remove('sel', 'nudge-l', 'nudge-r', 'enter');
  fly.classList.add('fly');
  fly.removeAttribute('href');
  Object.assign(fly.style, { left: r.left + 'px', top: r.top + 'px', width: w + 'px', height: h + 'px' });
  document.body.appendChild(fly);
  b.style.visibility = 'hidden';
  nudge(b, false);

  const inner = fly.querySelector('.bk-3d'), cover = fly.querySelector('.bk-cover');
  const S = Math.min(innerHeight * .6, 460) / h;                  // final scale
  const cx = innerWidth / 2 - (r.left + w / 2), cy = innerHeight / 2 - (r.top + h / 2) - 10;
  const ease = 'cubic-bezier(.22,.8,.2,1)';
  const startRot = getComputedStyle(inner).transform;
  // 1. up off the shelf, out to the centre, turning to face you
  fly.animate([
    { transform: 'translate(0,0) scale(1)' },
    { transform: `translate(${cx * .35}px,${cy * .25 - 60}px) scale(${1 + (S - 1) * .4})`, offset: .45 },
    { transform: `translate(${cx}px,${cy}px) scale(${S})` },
  ], { duration: 640, easing: ease, fill: 'forwards' });
  inner.animate([
    { transform: startRot === 'none' ? 'rotateY(0deg)' : startRot },
    { transform: 'rotateY(-90deg)' },
  ], { duration: 640, easing: ease, fill: 'forwards' });
  // 2. the cover swings open on its hinge — the edge that meets the spine,
  //    which after the turn is the left edge; it comes toward you, then lies flat
  const base = `rotateY(90deg) translateZ(${w / 2}px)`;
  const hinge = a => `${base} translateX(${-d / 2}px) rotateY(${a}deg) translateX(${d / 2}px)`;
  const swing = { duration: 600, delay: 500, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' };
  cover.animate([{ transform: hinge(0) }, { transform: hinge(-168) }], swing);
  fly.querySelector('.bk-inside').animate([{ transform: hinge(0) + ' rotateY(180deg)' }, { transform: hinge(-168) + ' rotateY(180deg)' }], swing);
  // the small page gives way to the big one
  fly.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: 960, easing: 'ease-in', fill: 'forwards' });
  // 3. the page grows until it is the whole screen
  const veil = document.createElement('div');
  veil.className = 'pageveil';
  document.body.appendChild(veil);
  const pw = d * S, ph = h * S;                                    // page size on screen
  const px = innerWidth / 2 - pw / 2 + (w * S) / 2 - 2, py = innerHeight / 2 - 10 - ph / 2;
  const small = `translate(${px}px,${py}px) scale(${pw / innerWidth},${ph / innerHeight})`;
  veil.animate([
    { opacity: 0, transform: small, borderRadius: '3px' },
    { opacity: 1, transform: small, offset: .25, borderRadius: '3px' },
    { opacity: 1, transform: 'translate(0,0) scale(1,1)', borderRadius: '0' },
  ], { duration: 620, delay: 760, easing: 'cubic-bezier(.4,0,.1,1)', fill: 'forwards' });
  setTimeout(() => { location.href = href; }, 1300);
  // if the navigation is cancelled, put the book back
  setTimeout(() => { if (!document.hidden && opening){ fly.remove(); veil.remove(); b.style.visibility = ''; opening = false; } }, 6000);
}
card.addEventListener('click', e => {
  const a = e.target.closest('.cc-go');
  if (!a || reduced || e.metaKey || e.ctrlKey) return;
  const b = cardFor;
  if (b && !b.hasAttribute('data-planned') && visible(b)) open(b, e);
});
// Coming back with the back button: put everything back.
addEventListener('pageshow', e => {
  opening = false;
  $$('.bk.fly, .pageveil').forEach(x => x.remove());
  books.forEach(b => { b.classList.remove('sel', 'nudge-l', 'nudge-r'); b.style.visibility = ''; });
  if (e.persisted) stacks.classList.remove('ready');
});

/* ── follow a shelf ── */
const fsheet = $('fsheet'), fscrim = $('fscrim'), fsForm = $('fsForm');
let followId = '';
function openFollow(id, name){
  followId = id;
  $('fsTitle').textContent = name;
  fsForm.hidden = false; $('fsDone').hidden = true; $('fsErr').hidden = true;
  $('fsGo').disabled = false; $('fsEmail').value = '';
  fsheet.classList.add('on'); fscrim.classList.add('on'); fsheet.setAttribute('aria-hidden', 'false');
  setTimeout(() => $('fsEmail').focus(), 60);
}
function closeFollow(){ fsheet.classList.remove('on'); fscrim.classList.remove('on'); fsheet.setAttribute('aria-hidden', 'true'); }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-follow]');
  if (b) openFollow(b.dataset.follow, b.dataset.name);
});
fscrim.addEventListener('click', closeFollow);
$('fsClose').addEventListener('click', closeFollow);
addEventListener('keydown', e => { if (e.key === 'Escape') closeFollow(); });
fsForm.addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('fsEmail').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  $('fsGo').disabled = true; $('fsErr').hidden = true;
  let ok = false;
  try {
    const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, writings: true, billion: false, series: followId, source: 'series' }) });
    ok = r.ok;
  } catch {}
  if (!ok){ $('fsErr').hidden = false; $('fsErr').textContent = 'That did not go through — the list is not switched on yet. Try again soon.'; $('fsGo').disabled = false; return; }
  fsForm.hidden = true; $('fsDone').hidden = false;
  const btn = document.querySelector(`[data-follow="${followId}"]`);
  if (btn){ btn.classList.add('done'); btn.lastChild.textContent = ' Following'; }
  setTimeout(closeFollow, 1800);
});

/* ── the lamp follows you ── */
if (!reduced && !coarse){
  let raf = 0, x = 0, y = 0;
  addEventListener('pointermove', e => {
    x = e.clientX; y = e.clientY;
    if (raf) return;
    raf = requestAnimationFrame(() => { room.style.setProperty('--mx', x + 'px'); room.style.setProperty('--my', y + 'px'); raf = 0; });
  }, { passive: true });
}

/* ── go ── */
readURL();
apply(false);
requestAnimationFrame(() => stacks.classList.add('ready'));
setTimeout(() => stacks.classList.remove('ready'), 3200); // entrance only once
