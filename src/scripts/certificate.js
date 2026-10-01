/* The certificate. Pure SVG text so it can be shown inline and exported
   to PNG with no libraries. Keep it to <text>; foreignObject will not
   survive the canvas export. */
import { esc, money } from './shared.js';
import { SITE } from '../site.config.js';

export const CERT_W = 1200, CERT_H = 720;

function ordinalSerial(n){
  return 'AC-2026-' + String(n).padStart(6, '0');
}

export function certSVG(name, amount, number, when = new Date()){
  const date = when.toLocaleDateString('en-GB',
    {day:'numeric', month:'long', year:'numeric'});
  const t = (x,y,txt,o={}) =>
    '<text x="' + x + '" y="' + y + '"' +
    ' font-family="' + (o.f || 'Iowan Old Style, Charter, Georgia, serif') + '"' +
    ' font-size="' + (o.s || 20) + '" font-weight="' + (o.w || 400) + '"' +
    ' fill="' + (o.c || '#16130d') + '"' +
    ' text-anchor="' + (o.a || 'start') + '"' +
    (o.ls ? ' letter-spacing="' + o.ls + '"' : '') +
    '>' + esc(txt) + '</text>';
  const SANS = 'Helvetica Neue, Helvetica, Arial, sans-serif';
  const MONO = 'SF Mono, Menlo, Consolas, monospace';
  const badge = (x,y) =>
    '<g><rect x="' + x + '" y="' + y + '" width="46" height="46" rx="3" fill="none" ' +
    'stroke="#0e8a4f" stroke-width="3"/>' +
    t(x+23, y+31, '$1', {s:19, w:700, c:'#0e8a4f', a:'middle'}) + '</g>';

  // clamp a long name so it never overflows the plate
  const shown = name.length > 30 ? name.slice(0, 29) + '…' : name;
  const nameSize = shown.length > 22 ? 44 : shown.length > 15 ? 54 : 64;

  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + CERT_W + '" height="' + CERT_H +
    '" viewBox="0 0 ' + CERT_W + ' ' + CERT_H + '">' +
    '<defs><pattern id="g" width="120" height="120" patternUnits="userSpaceOnUse">' +
      '<circle cx="60" cy="60" r="52" fill="none" stroke="#0e8a4f" stroke-width="1"/>' +
      '<circle cx="60" cy="60" r="34" fill="none" stroke="#0e8a4f" stroke-width="1"/>' +
      '<circle cx="60" cy="60" r="16" fill="none" stroke="#0e8a4f" stroke-width="1"/>' +
    '</pattern></defs>' +

    '<rect width="' + CERT_W + '" height="' + CERT_H + '" fill="#f7f4ec"/>' +
    '<rect width="' + CERT_W + '" height="' + CERT_H + '" fill="url(#g)" opacity="0.08"/>' +
    '<rect x="40" y="52" width="' + (CERT_W-68) + '" height="' + (CERT_H-80) + '" fill="#0e8a4f"/>' +
    '<rect x="28" y="28" width="' + (CERT_W-68) + '" height="' + (CERT_H-80) +
      '" fill="#fffdf8" stroke="#16130d" stroke-width="3"/>' +
    '<rect x="44" y="44" width="' + (CERT_W-100) + '" height="' + (CERT_H-112) +
      '" fill="none" stroke="#ddd6c6" stroke-width="1"/>' +

    badge(52, 52) + badge(CERT_W-166, 52) +
    badge(52, CERT_H-186) + badge(CERT_W-166, CERT_H-186) +

    '<circle cx="600" cy="112" r="19" fill="#0e8a4f"/>' +
    t(600, 120, '$', {s:22, w:700, c:'#fffdf8', a:'middle'}) +
    t(600, 168, 'ASKING COMPANY', {f:SANS, s:15, w:800, ls:'6', a:'middle'}) +
    t(600, 212, 'CERTIFICATE OF NOTHING', {f:SANS, s:12, w:800, ls:'5', c:'#847d70', a:'middle'}) +

    t(600, 258, 'This certifies that', {s:19, c:'#4a453b', a:'middle'}) +
    t(600, 258 + (nameSize > 50 ? 74 : 62), shown, {s:nameSize, w:700, a:'middle'}) +
    '<line x1="300" y1="' + (258 + (nameSize > 50 ? 96 : 84)) + '" x2="900" y2="' +
      (258 + (nameSize > 50 ? 96 : 84)) + '" stroke="#ddd6c6" stroke-width="1"/>' +

    t(600, 402, 'gave ' + money(amount) + ' on ' + date, {s:19, c:'#4a453b', a:'middle'}) +

    t(600, 480, 'GIVER No. ' + number.toLocaleString('en-US'), {s:46, w:700, c:'#0e8a4f', a:'middle'}) +
    t(600, 512, 'of 1,000,000,000', {f:MONO, s:16, c:'#847d70', a:'middle'}) +

    t(600, 552, 'In exchange the holder received nothing.', {s:18, c:'#4a453b', a:'middle'}) +
    t(600, 578, 'This certificate is a record of that nothing.', {s:18, w:700, a:'middle'}) +

    '<line x1="96" y1="608" x2="1104" y2="608" stroke="#16130d" stroke-width="2"/>' +
    t(96, 634, ordinalSerial(number), {f:MONO, s:14, c:'#847d70'}) +
    t(96, 654, SITE.domainLabel, {f:MONO, s:13, c:'#16130d'}) +
    t(600, 644, 'Not transferable · Not redeemable · Not a security',
      {f:SANS, s:11, w:800, ls:'2', c:'#847d70', a:'middle'}) +
    t(1104, 634, 'Sole director', {f:SANS, s:11, w:800, ls:'2', c:'#847d70', a:'end'}) +
    t(1104, 656, 'Asking Company', {f:'Iowan Old Style, Charter, Georgia, serif', s:15, w:700, a:'end'}) +
  '</svg>';
}

export function downloadCert(svg, number){
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = CERT_W * 2; c.height = CERT_H * 2;
    const ctx = c.getContext('2d');
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    c.toBlob(png => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(png);
      a.download = 'asking-company-giver-' + number + '.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, 'image/png');
  };
  img.onerror = () => {
    const a = document.createElement('a');
    a.href = url; a.download = 'asking-company-giver-' + number + '.svg'; a.click();
  };
  img.src = url;
}
