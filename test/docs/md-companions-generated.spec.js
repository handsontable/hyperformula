/**
 * Tests for the md-companions VuePress plugin's `generated()` hook (HF-154).
 * `fs` is stubbed, so no real files are written. This is a `.js` Jest spec
 * (Karma globs only `.spec.ts`, so it never runs in the browser bundle — the
 * hook is plain Node code).
 */
const fs = require('fs')
const mdCompanions = require('../../docs/.vuepress/plugins/md-companions')

// outDir `/out` sits under the served root `/` (base `/docs/`), so the root
// mirror writes land at `/llms-full.txt` and `/llms.txt`.
function makeCtx(pages) {
  return { base: '/docs/', outDir: '/out', pages }
}

const run = (pages, opts = { hostname: 'https://h.example.com' }) =>
  mdCompanions(opts, makeCtx(pages)).generated()

describe('md-companions generated()', () => {
  let writes

  beforeEach(() => {
    writes = []
    jest.spyOn(fs.promises, 'writeFile').mockImplementation((f, c) => {
      writes.push({ f: String(f), c })
      return Promise.resolve()
    })
    jest.spyOn(fs.promises, 'mkdir').mockImplementation(() => Promise.resolve())
    jest.spyOn(fs.promises, 'readFile').mockResolvedValue('# HyperFormula\nindex')
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())

  const mdFiles = () => writes.filter(w => w.f.endsWith('.md')).map(w => w.f)
  const wrote = (p) => writes.some(w => w.f === p)

  it('writes one .md per .html page and mirrors the corpus to /docs and the site root', async () => {
    await run([
      { path: '/guide/basic.html', title: 'Basic', _strippedContent: '# Basic\n' },
      { path: '/api/index.html', title: 'API', _strippedContent: '# API\n' },
    ])
    expect(mdFiles().some(f => f.endsWith('guide/basic.md'))).toBe(true)
    expect(mdFiles().some(f => f.endsWith('api/index.md'))).toBe(true)
    expect(wrote('/out/llms-full.txt')).toBe(true)   // under base /docs/
    expect(wrote('/llms-full.txt')).toBe(true)        // mirrored to served root (GH Pages)
    expect(wrote('/llms.txt')).toBe(true)             // index mirrored to root
  })

  it('includes clean-URL / directory pages (home, section index) and skips 404', async () => {
    await run([
      { path: '/', title: 'Home', _strippedContent: 'Welcome' },
      { path: '/guide/', title: 'Guide', _strippedContent: 'Guide index' },
      { path: '/404.html', title: '404', _strippedContent: 'nope' },
    ])
    expect(mdFiles().some(f => f.endsWith('/out/index.md'))).toBe(true)      // home → index.md
    expect(mdFiles().some(f => f.endsWith('guide/index.md'))).toBe(true)     // /guide/ → guide/index.md
    expect(mdFiles().some(f => f.includes('404'))).toBe(false)
  })

  it('isolates a page that throws during strip and still writes the others + corpus', async () => {
    await run([
      { path: '/ok.html', title: 'Ok', _strippedContent: 'fine' },
      { path: '/bad.html', title: 'Bad', _strippedContent: 123 }, // non-string → strip throws → caught
    ])
    expect(mdFiles().some(f => f.endsWith('ok.md'))).toBe(true)
    expect(mdFiles().some(f => f.endsWith('bad.md'))).toBe(false)
    expect(wrote('/out/llms-full.txt')).toBe(true)
    expect(console.warn).toHaveBeenCalled()
  })

  it('does not abort the build when a corpus write fails — it warns instead', async () => {
    fs.promises.writeFile.mockImplementation((f) => (
      String(f).endsWith('llms-full.txt')
        ? Promise.reject(new Error('disk full'))
        : Promise.resolve()
    ))
    await expect(run([{ path: '/a.html', title: 'A', _strippedContent: 'x' }])).resolves.toBeUndefined()
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('llms-full.txt'))
  })

  it('handles empty _strippedContent without throwing (empty .md emitted)', async () => {
    await expect(run([{ path: '/e.html', title: 'E', _strippedContent: '' }])).resolves.toBeUndefined()
    expect(writes.some(w => w.f.endsWith('e.md') && w.c === '')).toBe(true)
  })

  it('builds per-entry URL from hostname + base + slug (no double/missing slash)', async () => {
    await run([{ path: '/guide/basic.html', title: 'Basic', _strippedContent: 'x' }])
    const c = writes.find(w => w.f === '/out/llms-full.txt').c
    expect(c).toContain('URL: https://h.example.com/docs/guide/basic')
  })
})
