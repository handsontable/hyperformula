import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsSchema } from '@astrojs/starlight/schema';
import { PAGE_EXCLUDES, PAGE_SOURCES, pageId } from './page-id.mjs';

export const collections = {
  // The pages are read where they are, not from `src/content/docs/`: the guides in `guide/`, the generated API
  // reference in `api/`, and the home page. `markdown.processedDirs` in `astro.config.mjs` lists the same directories
  // for Starlight's own Markdown transforms.
  docs: defineCollection({
    loader: glob({
      base: '.',
      pattern: [...PAGE_SOURCES, ...PAGE_EXCLUDES.map((pattern) => `!${pattern}`)],
      generateId: ({ entry }) => pageId(entry),
    }),
    schema: docsSchema({
      extend: z.object({
        // Search keywords that are not in the text; indexed with the page (see `components/MarkdownContent.astro`).
        tags: z.array(z.string()).optional(),
      }),
    }),
  }),
};
