/**
 * Remark plugin replacing the VuePress `{{ $page.<key> }}` interpolations
 * (functionsCount, languagesCount, version, buildDate, releaseDate) with the
 * build-time values from `docs-data.mjs`, so content keeps the HF-282
 * auto-derived totals instead of hardcoded numbers that rot.
 *
 * Only plain text and raw-HTML nodes are rewritten; fenced and inline code
 * are distinct mdast node types and keep their literal `{{ ... }}`. The tree
 * is walked directly rather than through `unist-util-visit`, which is only a
 * transitive dependency here.
 */
import { substituteDocsData } from './docs-data.mjs';

/** @param {{ type: string, value?: string, children?: object[] }} node */
function walk(node) {
  if ((node.type === 'text' || node.type === 'html') && node.value && node.value.includes('{{ $page.')) {
    node.value = substituteDocsData(node.value);
  }
  if (node.children) {
    for (const child of node.children) walk(child);
  }
}

export function remarkDocsData() {
  return (tree) => walk(tree);
}
