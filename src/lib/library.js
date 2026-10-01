/* Turns the writing collection into books: spine size, colour,
   reading time. Everything visual about a book derives from here. */
import { getCollection } from 'astro:content';
import { SERIES, PLANNED } from '../data/series.js';

/* Cloth colours for pieces that don't name their own. */
const CLOTH = [
  ['#123f2c', '#f0ede2'], ['#0f4c5c', '#eef7f9'], ['#7a2e1d', '#f6e9df'],
  ['#2b2f6b', '#ecebf8'], ['#5b4a1f', '#f5efdc'], ['#3d1f3a', '#f4e8f1'],
  ['#1f3d5b', '#e8f0f7'], ['#6b1f2b', '#f7e6e8'], ['#2e4a1f', '#ecf3e4'],
  ['#c9b98f', '#16130d'], ['#d8cfb8', '#16130d'], ['#16130d', '#f7f4ec'],
];

const hash = s => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const countWords = md => (md || '')
  .replace(/^---[\s\S]*?---/, '')
  .replace(/[#>*_`\[\]()]/g, ' ')
  .split(/\s+/).filter(Boolean).length;

export const fmtDate = d => d.toLocaleDateString('en-GB',
  { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export async function getBooks(){
  const entries = (await getCollection('writing', e => import.meta.env.DEV || !e.data.draft))
    .sort((a, b) => a.data.date - b.data.date);

  return entries.map((e, i) => {
    const words = countWords(e.body);
    const h = hash(e.id);
    const [cloth, ink] = CLOTH[h % CLOTH.length];
    return {
      slug: e.id,
      href: `/writing/${e.id}`,
      entry: e,
      ...e.data,
      no: String(i + 1).padStart(2, '0'),
      words,
      minutes: Math.max(1, Math.round(words / 230)),
      dateLabel: fmtDate(e.data.date),
      iso: e.data.date.toISOString().slice(0, 10),
      spine: e.data.spine || cloth,
      spineInk: e.data.spineInk || ink,
      // Thickness follows length; height is the author's or a stable guess.
      w: Math.round(clamp(30 + words / 45, 34, 74)),
      h: e.data.height || 178 + (h % 64),
      seriesName: (SERIES.find(s => s.id === e.data.series) || {}).name || 'Unfiled',
    };
  });
}

export function getPlanned(){
  return PLANNED.map((p, i) => ({
    ...p,
    planned: true,
    slug: 'planned-' + i,
    w: 32 + (hash(p.title) % 14),
    h: 160 + (hash(p.title) % 62),
    lean: [0, -5, 0, 0, -7, 0][i % 6],
  }));
}

export { SERIES };
