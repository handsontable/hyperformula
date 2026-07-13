/**
 * CI-discoverable tests for the md-companions VuePress plugin's markdown
 * stripper (HF-154, agent-friendly docs). The stripper turns VuePress-flavoured
 * markdown into clean markdown for the per-page `.md` companions and `llms.txt`,
 * so its fidelity is the acceptance gate for the feature.
 *
 * This is a `.js` spec under `test/` so Jest's testMatch (`test/**\/*spec.(ts|js)`)
 * discovers it, while Karma (which only globs `.spec.ts`) skips it — the stripper
 * is plain Node code that does not run in the browser bundle.
 */
const { stripVuePressSyntax } = require('../../docs/.vuepress/plugins/md-companions/strip')

describe('md-companions stripVuePressSyntax', () => {
  it('converts a tip container with a title to a blockquote', () => {
    expect(stripVuePressSyntax(':::tip Heads up\nBe careful here.\n:::'))
      .toBe('> **Heads up**\n>\n> Be careful here.')
  })

  it('converts a titleless warning container to a blockquote', () => {
    expect(stripVuePressSyntax(':::warning\nDanger zone.\n:::'))
      .toBe('> Danger zone.')
  })

  it('leaves ::: tokens inside a code fence untouched', () => {
    expect(stripVuePressSyntax('```js\nconst x = ":::tip";\n```'))
      .toBe('```js\nconst x = ":::tip";\n```')
  })

  it('does not close a container on a ::: that sits inside a fenced block in its body', () => {
    const out = stripVuePressSyntax(':::tip\nBe careful\n```\n:::\n```\ndone\n:::')
    expect(out).toContain('> Be careful')  // container recognised
    expect(out).toContain('done')          // body not truncated at the fenced :::
    expect(out).not.toMatch(/^:::$/m)      // no leaked bare ::: closer
  })

  it('removes <script> blocks', () => {
    expect(stripVuePressSyntax('Text before\n<script>\nconsole.log(1)\n</script>\nText after'))
      .toBe('Text before\nText after')
  })

  it('removes self-closing Vue components', () => {
    expect(stripVuePressSyntax('Intro\n<CodingAgentWizard />\nOutro'))
      .toBe('Intro\nOutro')
  })

  it('removes the [[toc]] marker', () => {
    expect(stripVuePressSyntax('# Title\n[[toc]]\nBody'))
      .toBe('# Title\nBody')
  })

  it('removes an inline [[toc]] marker, keeping surrounding text', () => {
    expect(stripVuePressSyntax('**Contents:** [[toc]]'))
      .toBe('**Contents:**')
  })

  it('drops a trailing heading whose only body was a stripped :::example demo', () => {
    expect(stripVuePressSyntax('Body text.\n\n## Demo\n\n::: example #ex --html 1\n@[code](example.html)\n:::'))
      .toBe('Body text.')
  })

  it('normalises whitespace-only lines to clean blank lines', () => {
    expect(stripVuePressSyntax('a\n  \nb'))
      .toBe('a\n\nb')
  })

  it('preserves plain markdown content', () => {
    expect(stripVuePressSyntax('# H\n\n`code`\n\n[link](/guide/x)\n\n| a | b |\n|---|---|'))
      .toBe('# H\n\n`code`\n\n[link](/guide/x)\n\n| a | b |\n|---|---|')
  })

  it('strips :::example (live demo) containers entirely', () => {
    expect(stripVuePressSyntax('## Demo\n\n::: example #ex1 --html 1\n@[code](example.html)\n:::\n\nOutro'))
      .toBe('## Demo\n\nOutro')
  })

  it('does not let an inner 3-backtick fence close a 4-backtick outer fence', () => {
    expect(stripVuePressSyntax('````markdown\n```js\ncode\n```\n````'))
      .toBe('````markdown\n```js\ncode\n```\n````')
  })

  it('strips an inline self-closing Vue component but keeps the surrounding text', () => {
    expect(stripVuePressSyntax('# AbsoluteCellRange <Badge text="Class"/>'))
      .toBe('# AbsoluteCellRange')
    expect(stripVuePressSyntax('### end <Badge text="Readonly" vertical="middle"/>'))
      .toBe('### end')
  })

  it('leaves lowercase inline HTML (e.g. <br/>) untouched', () => {
    expect(stripVuePressSyntax('line one<br/>line two'))
      .toBe('line one<br/>line two')
  })

  it('does not strip an inline component inside a code fence', () => {
    expect(stripVuePressSyntax('```md\n# Foo <Badge text="Class"/>\n```'))
      .toBe('```md\n# Foo <Badge text="Class"/>\n```')
  })

  it('drops both tags of a paired block component but keeps the inner content', () => {
    expect(stripVuePressSyntax('<Collapse>\ninner prose\n</Collapse>'))
      .toBe('inner prose')
  })

  it('drops a single-line <script>…</script> without swallowing following content', () => {
    expect(stripVuePressSyntax('# T\n\n<script>var x=1;</script>\n\nReal para.'))
      .toBe('# T\n\nReal para.')
  })

  it('does not collapse blank lines inside a code fence', () => {
    expect(stripVuePressSyntax('```js\nline1\n\n\n\nline4\n```'))
      .toBe('```js\nline1\n\n\n\nline4\n```')
  })

  it('collapses 3+ blank lines to one outside fences', () => {
    expect(stripVuePressSyntax('a\n\n\n\nb'))
      .toBe('a\n\nb')
  })

  it('keeps {{ }} interpolations verbatim (cannot expand from source markdown)', () => {
    expect(stripVuePressSyntax('HyperFormula ships {{ $page.functionsCount }} functions.'))
      .toBe('HyperFormula ships {{ $page.functionsCount }} functions.')
  })

  it('unwraps a Vue-bound anchor, keeping its link text', () => {
    expect(stripVuePressSyntax("See the <a :href=\"'https://x/' + $page.buildDateURIEncoded\">demo</a> here."))
      .toBe('See the demo here.')
  })

  it('drops a Vue-bound image tag', () => {
    expect(stripVuePressSyntax('<img :src="$withBase(\'/logo.png\')">'))
      .toBe('')
  })

  it('leaves {{ }} and :href inside a code fence untouched', () => {
    expect(stripVuePressSyntax('```md\n{{ $page.x }} <a :href="y">z</a>\n```'))
      .toBe('```md\n{{ $page.x }} <a :href="y">z</a>\n```')
  })
})
