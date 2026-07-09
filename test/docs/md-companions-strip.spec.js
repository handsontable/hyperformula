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
})
