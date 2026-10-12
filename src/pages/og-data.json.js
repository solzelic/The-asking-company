/* /og-data.json — what the link-preview function needs for each essay. */
import { getBooks } from '../lib/library.js';
export async function GET(){
  const books = await getBooks();
  const data = Object.fromEntries(books.map(b => [b.slug, {
    title: b.title, series: b.seriesName, no: b.no, date: b.dateLabel, cloth: b.spine, ink: b.spineInk, minutes: b.minutes,
  }]));
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
}
