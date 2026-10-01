/* Nav: hides on the way down, returns on the way up. Hamburger menu. */
const $ = id => document.getElementById(id);
const nav = $('nav'), burger = $('burger'), menu = $('menu');

function syncNav(){ document.documentElement.style.setProperty('--navh', nav.offsetHeight + 'px'); }
syncNav();

let lastY = 0;
addEventListener('scroll', () => {
  const y = scrollY;
  nav.classList.toggle('hide', y > 130 && y > lastY && !menu.classList.contains('open'));
  lastY = y;
}, { passive: true });

function setMenu(open){
  menu.classList.toggle('open', open);
  burger.classList.toggle('on', open);
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
}
burger.addEventListener('click', e => { e.stopPropagation(); setMenu(!menu.classList.contains('open')); });
document.addEventListener('click', e => {
  if (menu.classList.contains('open') && !menu.contains(e.target) && e.target !== burger) setMenu(false);
});
addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
addEventListener('resize', () => { setMenu(false); syncNav(); });
