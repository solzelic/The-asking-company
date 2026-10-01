/* ══════════════════════════════════════════════════════════
   THE ASK
   Any element with data-ask="N" asks for N dollars.
   Confirm → optional ledger name → Stripe Checkout → /thanks.
   ══════════════════════════════════════════════════════════ */
import { $, money, esc, openModal, closeModal, ACTIONS, validAmount } from './shared.js';

const REFUSALS = ['That is fine. It is one dollar.',
  'Understood. The offer does not expire.', 'Noted for the record.'];
let refusals = 0;

function askFor(amount){
  if (!validAmount(amount)) amount = 1;
  openModal(
    '<div class="faint" style="font-size:10px;font-weight:800;letter-spacing:.2em;text-transform:uppercase">' +
      (amount === 1 ? 'Confirm' : 'Confirm — again') + '</div>' +
    '<div class="amt">' + money(amount) + '</div>' +
    '<div class="disclose"><b>What you receive</b><ul>' +
      '<li>One Certificate of Nothing, on screen, immediately.</li>' +
      '<li>No equity. No shares. No stake.</li>' +
      '<li>No other product, service, or future consideration.</li>' +
      '<li>Your name on the ledger, if you want it there.</li></ul></div>' +
    '<label for="ledgerName" style="display:block;text-align:left;font-size:10px;font-weight:800;' +
      'letter-spacing:.14em;text-transform:uppercase;color:var(--ink-45);margin-bottom:6px">' +
      'Name for the public ledger — optional</label>' +
    '<input id="ledgerName" placeholder="Anonymous" maxlength="46" autocomplete="off" ' +
      'value="' + esc(sessionStorageGet('ac-name')) + '">' +
    '<div class="row"><button class="btn sm ghost" data-act="decline">No</button>' +
    '<button class="btn sm" data-act="pay" data-amount="' + amount + '">Yes, ' + money(amount) + '</button></div>' +
    '<p class="err" id="payErr" role="alert" hidden></p>' +
    '<p class="tiny">Secure checkout by Stripe. Apple Pay and Google Pay work. ' +
      'Refundable within 30 days — <a href="/terms">terms</a>. Anything typed above appears publicly ' +
      'and does not have to be your name; historically it usually is not.</p>'
  );
}

function decline(){
  refusals++;
  const line = refusals > REFUSALS.length
    ? 'You have now declined ' + refusals + ' times. We remain unbothered.'
    : REFUSALS[refusals - 1];
  openModal(
    '<h2>' + line + '</h2><p class="dim">The button will still be there.</p>' +
    '<div class="row"><button class="btn sm ghost" data-act="close">Close</button>' +
    '<button class="btn sm" data-ask="1">Fine. One dollar.</button></div>'
  );
}

async function pay(btn){
  const amount = Number(btn.dataset.amount);
  const name = ($('ledgerName')?.value || '').trim();
  sessionStorageSet('ac-name', name);
  const err = $('payErr');
  btn.disabled = true;
  btn.textContent = 'One moment…';
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, name, lang: document.documentElement.dataset.askLang || 'en' }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) { location.href = data.url; return; }
    throw new Error(data.error || (res.status === 404 || res.status === 405
      ? 'Payments are not switched on yet. No money moved. The intention has been noted.'
      : 'Something went wrong on our side. No money moved.'));
  } catch (e) {
    err.hidden = false;
    err.textContent = e.message && !/fetch|JSON|network/i.test(e.message)
      ? e.message : 'Payments are not switched on yet. No money moved.';
    btn.disabled = false;
    btn.textContent = 'Try again';
  }
}

function sessionStorageGet(k){ try { return sessionStorage.getItem(k) || ''; } catch { return ''; } }
function sessionStorageSet(k, v){ try { sessionStorage.setItem(k, v); } catch {} }

Object.assign(ACTIONS, { decline, pay, close: closeModal });

document.addEventListener('click', e => {
  const el = e.target.closest('[data-ask]');
  if (!el) return;
  e.preventDefault();
  askFor(Number(el.dataset.ask) || 1);
});

/* Stripe sends people who back out to /?declined=1. Treat it as a refusal. */
if (new URLSearchParams(location.search).get('declined')) {
  history.replaceState(null, '', location.pathname);
  setTimeout(decline, 400);
}
