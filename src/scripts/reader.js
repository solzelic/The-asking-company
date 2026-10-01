/* ══════════════════════════════════════════════════════════
   THE READER
   Settings (type, size, leading, measure, theme, focus),
   the section rail, resume-where-you-left-off, quote sharing,
   listen (speech synthesis) and keyboard navigation.
   Settings are applied before paint by the inline script in
   the page head; this file owns everything after that.
   ══════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const KEY = 'ac-reader';
const page = document.querySelector('.essay-page');
const slug = page?.dataset.slug || location.pathname;
const title = page?.dataset.title || document.title;
const prose = $('prose');

/* ── settings ── */
const DEF = { font: 'serif', fs: 1, lh: 1.68, mw: 1, theme: 'paper', focus: false };
let S = { ...DEF };
try { S = { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch {}

function applySettings(){
  html.dataset.font = S.font;
  html.dataset.theme = S.theme;
  if (S.focus) html.dataset.focus = ''; else delete html.dataset.focus;
  html.style.setProperty('--fs', S.fs);
  html.style.setProperty('--lh', S.lh);
  html.style.setProperty('--mw', S.mw);
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
  // reflect in the sheet
  $$('[data-font]', sheet).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.font === S.font)));
  $$('[data-theme]', sheet).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === S.theme)));
  $$('[data-lh]', sheet).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.lh === S.lh)));
  $$('[data-mw]', sheet).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.mw === S.mw)));
  $('fsVal').textContent = Math.round(S.fs * 100) + '%';
  $('focusSw').checked = !!S.focus;
  if (S.focus) focusOn(); else focusOff();
  requestAnimationFrame(layoutRail);
}

const sheet = $('sheet'), scrim = $('scrim2');
function openSheet(o){
  sheet.classList.toggle('on', o); scrim.classList.toggle('on', o);
  $('aaBtn').setAttribute('aria-pressed', String(o));
  sheet.setAttribute('aria-hidden', String(!o));
}
$('aaBtn').addEventListener('click', () => openSheet(!sheet.classList.contains('on')));
scrim.addEventListener('click', () => openSheet(false));
sheet.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.font) S.font = b.dataset.font;
  else if (b.dataset.theme) S.theme = b.dataset.theme;
  else if (b.dataset.lh) S.lh = +b.dataset.lh;
  else if (b.dataset.mw) S.mw = +b.dataset.mw;
  else if (b.dataset.fs) S.fs = Math.round(Math.min(1.6, Math.max(.75, S.fs + (+b.dataset.fs))) * 100) / 100;
  else if (b.dataset.reset !== undefined) S = { ...DEF };
  else return;
  applySettings();
});
$('focusSw').addEventListener('change', e => { S.focus = e.target.checked; applySettings(); });

/* ── focus mode: keep the paragraph nearest the middle lit ── */
let focusObs = null;
function focusOn(){
  if (focusObs || !prose) return;
  focusObs = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('near', e.isIntersecting)),
    { rootMargin: '-35% 0px -35% 0px', threshold: 0 });
  $$(':scope > *', prose).forEach(el => focusObs.observe(el));
}
function focusOff(){
  if (!focusObs) return;
  focusObs.disconnect(); focusObs = null;
  $$('.near', prose).forEach(el => el.classList.remove('near'));
}

/* ── the rail ── */
const rail = $('rail');
const heads = $$('h2, h3', prose);
let marks = [];
function layoutRail(){
  if (!rail || !prose) return;
  const docH = document.documentElement.scrollHeight - innerHeight;
  if (docH <= 0) return;
  rail.querySelectorAll('.tk').forEach(t => t.remove());
  marks = heads.map(h => {
    const y = h.getBoundingClientRect().top + scrollY - 80;
    const b = document.createElement('button');
    b.className = 'tk'; b.type = 'button';
    b.style.top = Math.min(100, Math.max(0, (y / docH) * 100)) + '%';
    b.innerHTML = '<span class="lb">' + h.textContent.replace(/^§\s*/, '') + '</span>';
    b.setAttribute('aria-label', 'Jump to ' + h.textContent);
    b.addEventListener('click', () => h.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }));
    rail.appendChild(b);
    return { y, el: b };
  });
}
const barTitle = $('barTitle'), bar = $('lbar'), remain = $('remain'), pct = $('pct');
const words = +(page?.dataset.words || 0);
function onScroll(){
  const docH = document.documentElement.scrollHeight - innerHeight;
  const p = docH > 0 ? Math.min(1, scrollY / docH) : 0;
  rail?.style.setProperty('--p', (p * 100).toFixed(1) + '%');
  if (pct) pct.textContent = Math.round(p * 100) + '%';
  const head = document.querySelector('.ehead');
  const past = head && head.getBoundingClientRect().bottom < 60;
  rail?.classList.toggle('on', !!past && p < .985);
  bar?.classList.toggle('reading', !!past);
  if (remain){
    const left = Math.max(0, Math.round(((1 - p) * words) / 230));
    remain.textContent = p > .97 ? 'Finished' : left < 1 ? 'Under a minute left' : left + ' min left';
  }
  let cur = -1;
  marks.forEach((m, i) => { if (scrollY + 90 >= m.y) cur = i; });
  marks.forEach((m, i) => { m.el.classList.toggle('done', i < cur); m.el.classList.toggle('cur', i === cur); });
  $('tools')?.classList.toggle('away', p > .985 && !sheet.classList.contains('on'));
  savePos(p);
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => { layoutRail(); onScroll(); });

/* ── resume where you left off ── */
let saveT;
function savePos(p){
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem('ac-pos:' + slug, p < .97 ? String(p) : '0'); } catch {} }, 300);
}
(function offerResume(){
  let p = 0; try { p = +localStorage.getItem('ac-pos:' + slug) || 0; } catch {}
  if (p < .06 || scrollY > 100 || location.hash) return;
  const t = $('toast');
  t.querySelector('.msg').textContent = 'You were ' + Math.round(p * 100) + '% of the way through.';
  t.classList.add('on');
  const hide = () => t.classList.remove('on');
  t.querySelector('.go').addEventListener('click', () => {
    const docH = document.documentElement.scrollHeight - innerHeight;
    scrollTo({ top: p * docH, behavior: reduced ? 'auto' : 'smooth' }); hide();
  });
  t.querySelector('.x').addEventListener('click', hide);
  setTimeout(hide, 9000);
})();

/* ── quote: select text, share it ── */
const qpop = $('qpop');
let quote = '';
function placeQuote(){
  const sel = getSelection();
  const txt = sel && String(sel).trim();
  if (!txt || txt.length < 12 || !sel.rangeCount || !prose.contains(sel.anchorNode)){ qpop.classList.remove('on'); return; }
  const r = sel.getRangeAt(0).getBoundingClientRect();
  quote = txt.replace(/\s+/g, ' ');
  qpop.style.left = (r.left + r.width / 2 + scrollX) + 'px';
  qpop.style.top = (r.top + scrollY) + 'px';
  qpop.classList.add('on');
}
document.addEventListener('selectionchange', () => { clearTimeout(qpop._t); qpop._t = setTimeout(placeQuote, 220); });
document.addEventListener('pointerdown', e => { if (!qpop.contains(e.target)) qpop.classList.remove('on'); });
const permalink = () => location.origin + location.pathname;
$('qCopy').addEventListener('click', () => {
  navigator.clipboard?.writeText('“' + quote + '”\n— ' + title + '\n' + permalink()).then(() => flash($('qCopy'), 'Copied'));
});
$('qPost').addEventListener('click', () => {
  const t = encodeURIComponent('“' + (quote.length > 200 ? quote.slice(0, 197) + '…' : quote) + '” — ' + title);
  open('https://twitter.com/intent/tweet?text=' + t + '&url=' + encodeURIComponent(permalink()), '_blank', 'noopener');
});
function flash(b, msg){ const t = b.textContent; b.textContent = msg; setTimeout(() => (b.textContent = t), 1500); }

/* ── share ── */
$('shareBtn')?.addEventListener('click', async () => {
  const data = { title, text: page.dataset.dek || title, url: permalink() };
  if (navigator.share){ try { await navigator.share(data); } catch {} return; }
  navigator.clipboard?.writeText(permalink()).then(() => flash($('shareBtn').querySelector('.lbl') || $('shareBtn'), 'Link copied'));
});

/* ── listen ── */
const synth = window.speechSynthesis;
const listenBtn = $('listenBtn');
if (!synth || !window.SpeechSynthesisUtterance) listenBtn?.remove();
else {
  const paras = $$(':scope > p, :scope > h2, :scope > h3, :scope > blockquote, :scope > li', prose);
  let i = 0, playing = false, cur = null;
  const voice = () => {
    const vs = synth.getVoices();
    return vs.find(v => /en[-_](GB|IE|AU)/i.test(v.lang) && !/compact/i.test(v.name)) ||
           vs.find(v => /^en/i.test(v.lang)) || null;
  };
  function speak(){
    if (i >= paras.length){ stop(); return; }
    cur?.classList.remove('speaking');
    cur = paras[i]; cur.classList.add('speaking');
    if (cur.getBoundingClientRect().top < 80 || cur.getBoundingClientRect().bottom > innerHeight - 120)
      cur.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    const u = new SpeechSynthesisUtterance(cur.textContent.replace(/^§\s*/, ''));
    const v = voice(); if (v) u.voice = v;
    u.rate = 1.02; u.pitch = 1;
    u.onend = () => { if (playing){ i++; speak(); } };
    u.onerror = () => { if (playing){ i++; speak(); } };
    synth.speak(u);
  }
  function stop(){
    playing = false; synth.cancel(); cur?.classList.remove('speaking'); cur = null; i = 0;
    listenBtn.setAttribute('aria-pressed', 'false'); listenBtn.querySelector('.lbl').textContent = 'Listen';
  }
  listenBtn.addEventListener('click', () => {
    if (playing){ stop(); return; }
    // start from the paragraph nearest the top of the screen
    i = Math.max(0, paras.findIndex(p => p.getBoundingClientRect().bottom > 100));
    playing = true;
    listenBtn.setAttribute('aria-pressed', 'true'); listenBtn.querySelector('.lbl').textContent = 'Stop';
    synth.cancel(); speak();
  });
  addEventListener('pagehide', () => synth.cancel());
}

/* ── keys ── */
addEventListener('keydown', e => {
  if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Escape'){ openSheet(false); qpop.classList.remove('on'); }
  if (e.key === 'ArrowRight'){ const n = document.querySelector('.enav .nx[href]'); if (n) location.href = n.href; }
  if (e.key === 'ArrowLeft'){ const p = document.querySelector('.enav a:not(.nx)'); if (p) location.href = p.href; }
});

/* ── go ── */
applySettings();
document.fonts?.ready.then(() => { layoutRail(); onScroll(); });
layoutRail(); onScroll();
