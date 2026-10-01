/* Small helpers shared by the ask, the home page and the thank-you page. */

export const $ = id => document.getElementById(id);
export const money = n => '$' + Number(n).toLocaleString('en-US');
export const esc = s => String(s).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Powers of two only. The server enforces the same list. */
export const MAX_ASK = 524288;
export const validAmount = a => Number.isInteger(a) && a >= 1 && a <= MAX_ASK && (a & (a - 1)) === 0;

export function ladderLine(n){
  return ({
    2: 'Two dollars would be double one dollar.',
    4: 'Four dollars is less than a coffee. It is more than a feeling.',
    8: 'Eight is considered lucky in several cultures.',
    16: 'You could have bought lunch. You chose this.',
    32: 'Thirty-two dollars is the exact price of a small dignity.',
    64: 'Your accountant is now aware.',
    128: 'The doublings are doubling. This is fine.',
    256: 'This exceeds what my grandfather earned in a week.',
    512: 'Half a kilodollar. We should probably name it.',
    1024: 'One full kilodollar. We are in this together now.',
    2048: 'You have exceeded the total market value of the idea.',
    4096: 'You now own a meaningful share of nothing.',
    8192: 'I am legally required to ask whether you are okay.',
  })[n] || money(n) + '. We stopped writing custom lines at this point.';
}

/* ── modal ── */
let lastFocus = null;
export function openModal(html, size){
  lastFocus = document.activeElement;
  $('modalRoot').innerHTML = '<div class="scrim" data-scrim><div class="modal' +
    (size ? ' ' + size : '') + '" role="dialog" aria-modal="true">' + html + '</div></div>';
  document.body.style.overflow = 'hidden';
  const s = document.querySelector('[data-scrim]');
  s.addEventListener('click', e => { if (e.target === s) closeModal(); });
  const first = s.querySelector('input, button');
  if (first) setTimeout(() => first.focus(), 30);
}
export function closeModal(){
  $('modalRoot').innerHTML = '';
  document.body.style.overflow = '';
  lastFocus?.focus?.();
  document.dispatchEvent(new CustomEvent('modal:closed'));
}
addEventListener('keydown', e => { if (e.key === 'Escape' && $('modalRoot')?.innerHTML) closeModal(); });

/* Delegated clicks: any element with data-act="name" calls ACTIONS[name]. */
export const ACTIONS = {};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && ACTIONS[el.dataset.act]) { e.preventDefault(); ACTIONS[el.dataset.act](el); }
});

export function burst(){
  if (reduced) return;
  const d = document.createElement('div');
  d.className = 'burst';
  let h = '';
  for (let i = 0; i < 20; i++){
    h += '<span class="chip" style="left:' + (12 + Math.random() * 76).toFixed(0) +
      '%;top:' + (14 + Math.random() * 22).toFixed(0) + '%;--dx:' +
      (Math.random() * 200 - 100).toFixed(0) + 'px;--dr:' + (Math.random() * 800 - 400).toFixed(0) +
      'deg;animation-delay:' + (Math.random() * .22).toFixed(2) + 's">$</span>';
  }
  d.innerHTML = h;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2000);
}
