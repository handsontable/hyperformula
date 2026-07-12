/**
 * Corpus-level invariant tests for the md-companions stripper (HF-154).
 *
 * The per-transform unit tests (md-companions-strip.spec.js) check each rule in
 * isolation; this suite runs a stratified set of *whole-page* fixtures — one per
 * real HyperFormula docs page category — through the stripper and asserts the
 * output satisfies the "clean companion" invariants (no VuePress/Vue syntax
 * leaks outside code fences, no dangling empty heading). It encodes the bug
 * classes found on the live deploy-preview as regressions. No LLM / no build.
 *
 * `.js` Jest spec (Karma globs only `.spec.ts`, so it stays out of the bundle).
 */
const { stripVuePressSyntax } = require('../../docs/.vuepress/plugins/md-companions/strip')

// Leak invariants, checked on prose only (fenced code is preserved verbatim and
// may legitimately contain these tokens, so drop fenced blocks before matching).
function assertCleanProse(md) {
  const prose = md.replace(/```[\s\S]*?```/g, '')
  expect(prose).not.toMatch(/:::/)                 // container markers
  expect(prose).not.toMatch(/\[\[toc\]\]/i)        // toc markers
  expect(prose).not.toMatch(/<Badge/)              // inline Vue component
  expect(prose).not.toMatch(/\s:href=/)            // Vue-bound anchor
  expect(prose).not.toMatch(/\s:src=/)             // Vue-bound image
  expect(prose).not.toMatch(/@\[code\]/)           // include directive residue
  // No dangling empty heading at EOF when the page has real prose.
  const nonEmpty = md.split('\n').map(l => l.trim()).filter(Boolean)
  const hasProse = nonEmpty.some(l => !/^#{1,6}\s/.test(l))
  if (hasProse) expect(nonEmpty[nonEmpty.length - 1]).not.toMatch(/^#{1,6}\s/)
}

describe('md-companions corpus invariants', () => {
  it('guide page: tip container + code fence + trailing :::example demo', () => {
    const page = [
      '# Basic usage',
      '',
      '::: tip',
      'Use `buildFromArray` to create an instance.',
      ':::',
      '',
      'Then build it:',
      '',
      '```javascript',
      'const hf = HyperFormula.buildFromArray(data, options);',
      '```',
      '',
      '## Demo',
      '',
      '::: example #ex1 --html 1',
      '@[code](example.html)',
      ':::',
    ].join('\n')
    const out = stripVuePressSyntax(page)
    assertCleanProse(out)
    expect(out).toContain('# Basic usage')
    expect(out).toContain('const hf = HyperFormula.buildFromArray')  // fence preserved
    expect(out).not.toMatch(/## Demo\s*$/)                            // orphan heading gone
    expect(out).toMatch(/> Use `buildFromArray`/)                    // container → blockquote
  })

  it('integration page: {{ }} interpolation + Vue-bound anchor + fence', () => {
    const page = [
      '# Integration with Vue',
      '',
      'HyperFormula ships {{ $page.functionsCount }} functions.',
      '',
      "See the <a :href=\"'https://stackblitz.com/x?v=' + $page.buildDateURIEncoded\">Vue demo</a> for more.",
      '',
      '```js',
      'const x = 1;',
      '```',
    ].join('\n')
    const out = stripVuePressSyntax(page)
    assertCleanProse(out)
    expect(out).toContain('{{ $page.functionsCount }}')  // interpolation kept verbatim (by design)
    expect(out).toContain('See the Vue demo for more.')  // anchor unwrapped, text kept
    expect(out).toContain('const x = 1;')
  })

  it('branding page: Vue-bound image is dropped', () => {
    const page = [
      '# Branding',
      '',
      'Download our assets:',
      '',
      '<img :src="$withBase(\'/hf_logo.png\')">',
    ].join('\n')
    const out = stripVuePressSyntax(page)
    assertCleanProse(out)
    expect(out).toContain('Download our assets:')
  })

  it('API page: heading with inline <Badge> keeps the title, badge stripped', () => {
    const page = [
      '# AbsoluteCellRange <Badge text="Class"/>',
      '',
      '## Properties',
      '',
      '### end <Badge text="Readonly" vertical="middle"/>',
      '',
      'The end address of the range.',
    ].join('\n')
    const out = stripVuePressSyntax(page)
    assertCleanProse(out)
    expect(out).toContain('# AbsoluteCellRange')
    expect(out).toContain('### end')
    expect(out).toContain('The end address of the range.')
  })

  it('fence preservation: leak-like tokens inside a code block are NOT stripped', () => {
    const page = [
      '# Example',
      '',
      '```markdown',
      '::: tip',
      '<Badge text="x"/> [[toc]]',
      ':::',
      '```',
    ].join('\n')
    const out = stripVuePressSyntax(page)
    // Inside the fence everything survives verbatim.
    expect(out).toContain('::: tip')
    expect(out).toContain('<Badge text="x"/> [[toc]]')
  })

  it('title-only page is preserved (not wiped by the trailing-heading rule)', () => {
    expect(stripVuePressSyntax('# AbsoluteCellRange <Badge text="Class"/>'))
      .toBe('# AbsoluteCellRange')
  })
})
