/**
 * Astro content collection schema for the HyperFormula docs.
 *
 * Uses Starlight's standard `docsLoader()` over `src/content/docs/` so content
 * is rendered through Starlight's full markdown pipeline (asides, heading
 * anchors, etc.). Unlike Handsontable, HyperFormula has no per-framework content
 * variants, so no custom framework loader is needed.
 *
 * The `guide/` and `api/` trees are generated before each build (see
 * `scripts/generate-content.mjs` and the TypeDoc step); only `index.md` is
 * hand-authored. Legacy VuePress frontmatter fields are accepted via the schema
 * extension so generated/migrated `.md` files validate.
 */
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        /** VuePress unique page ID — coerced to string (some pages use numeric IDs). */
        id: z.coerce.string().optional(),

        /** Browser <title> override. */
        metaTitle: z.string().optional(),

        /** VuePress permalink — Starlight derives URLs from file paths. */
        permalink: z.string().optional(),

        /** Canonical URL hint. */
        canonicalUrl: z.string().optional(),

        /** Sidebar category label. */
        category: z.string().optional(),

        /** Sidebar badge label (e.g. "New", "Updated"). */
        menuTag: z.string().optional(),
      }),
    }),
  }),
};
