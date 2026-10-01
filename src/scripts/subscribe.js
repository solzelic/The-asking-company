/* Any <form data-subscribe> posts its email to /api/subscribe.
   Optional checkboxes named "writings" and "billion" choose the lists.
   On success the form is replaced by its data-done message. */
const APPOINTMENTS = ['VP of Reposting', 'Head of Group Chat Distribution', 'Chief Meme Officer',
  'Director of Screenshot Operations', 'Head of Awkward Mentions'];

document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-subscribe]');
  if (!f) return;
  e.preventDefault();
  const email = (f.querySelector('input[type=email]')?.value || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  const box = n => {
    const el = f.querySelector(`input[name=${n}]`);
    if (!el) return false;
    return el.type === 'checkbox' ? el.checked : true;
  };
  const body = { email, writings: box('writings'), billion: box('billion'), source: f.dataset.subscribe || 'site' };
  const btn = f.querySelector('button');
  if (btn) btn.disabled = true;
  let ok = false;
  try {
    const r = await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    ok = r.ok;
  } catch {}
  const role = APPOINTMENTS[email.length % APPOINTMENTS.length];
  const done = document.createElement('div');
  done.className = 'sub-done';
  done.innerHTML = ok
    ? (f.dataset.done || 'You are on the list.').replace('{role}', role)
    : 'That did not go through — the list is not switched on yet. Try again soon.';
  f.replaceWith(done);
});
