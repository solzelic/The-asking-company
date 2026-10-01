import rss from '@astrojs/rss';
import { getBooks } from '../lib/library.js';
import { SITE } from '../site.config.js';

export async function GET(context){
  const books = (await getBooks()).reverse();
  return rss({
    title: 'Asking Company — The Library',
    description: 'Longer pieces, bound and shelved.',
    site: context.site || SITE.url,
    items: books.map(b => ({
      title: b.title,
      description: b.dek,
      pubDate: b.date,
      link: b.href,
      categories: b.tags,
    })),
  });
}
