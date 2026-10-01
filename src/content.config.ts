import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/* One Markdown file per piece in src/content/writing/.
   The filename is the URL: succession-plan.md → /writing/succession-plan */
const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    dek: z.string(),                       // one line under the title
    date: z.coerce.date(),
    series: z.string().default('unfiled'), // a shelf id from src/data/series.js
    tags: z.array(z.string()).default([]),
    company: z.boolean().default(false),   // written for the company, in its voice
    spine: z.string().optional(),          // spine/cover colour, e.g. '#123f2c'
    spineInk: z.string().optional(),       // text colour on the spine
    height: z.number().optional(),         // spine height in px (160–250)
    cover: z.string().optional(),          // optional cover art in /public
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing };
