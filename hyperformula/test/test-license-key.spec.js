/**
 * Every engine the tests, the build scripts, the docs build and the formula editor demo build reads its
 * license key from one constant per consumer, so a new test key means pasting it into each constant. This
 * guard fails when the constants disagree, and when the key is written out anywhere else in the
 * repository, where it would keep the old key after a renewal.
 *
 * A `.js` spec, so it runs in Jest only: Karma loads `.spec.ts` files in the browser, which has no `fs`.
 */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '../..')

// The text of the internal test key every constant holds. It names its holder in capitals.
const TEST_KEY_MARKER = 'HYPERFORMULA INTERNAL TEST KEY'

// The constants, relative to the repository root. They must hold the same key.
const CONSTANTS = [
  'hyperformula/test/_setupFiles/testLicenseKey.ts',
  'hyperformula/script/test-license-key.js',
  'docs/src/test-license-key.mjs',
  'hyperformula-ui/demo/shared/test-license-key.ts',
]

// The private suite's own constant, checked when the suite is attached. The benchmarks also run against the base
// branch's engine, which may not have the constants above, so the suite keeps a copy of its own.
const PRIVATE_SUITE = 'hyperformula/test/hyperformula-tests'
const PRIVATE_SUITE_CONSTANT = `${PRIVATE_SUITE}/performance/testLicenseKey.ts`

// The files that may name the key's holder without holding the key: this guard, and the docs build check.
const MARKER_ONLY = ['hyperformula/test/test-license-key.spec.js', 'docs/src/preview-license-key.mjs']

const KEY_LITERAL = /'(This is a HyperFormula license key [^']*)'/g

describe('the internal test license key', () => {
  it('is the same key in every constant', () => {
    const attached = fs.existsSync(path.join(REPO_ROOT, PRIVATE_SUITE_CONSTANT)) ? [PRIVATE_SUITE_CONSTANT] : []
    const keys = [...CONSTANTS, ...attached].map((file) => {
      const found = [...fs.readFileSync(path.join(REPO_ROOT, file), 'utf8').matchAll(KEY_LITERAL)].map((match) => match[1])

      expect({file, count: found.length}).toEqual({file, count: 1})

      return found[0]
    })

    expect(new Set(keys).size).toBe(1)
    expect(keys[0]).toContain(TEST_KEY_MARKER)
  })

  it('is not written out in the files that may only name its holder', () => {
    // The search below skips these files by path, so check their content: no key literal, and not the key's
    // bracketed block, which any copy of the key holds whatever its quotes or line breaks.
    const key = [...fs.readFileSync(path.join(REPO_ROOT, CONSTANTS[0]), 'utf8').matchAll(KEY_LITERAL)][0][1]
    const block = key.slice(key.lastIndexOf('['))

    MARKER_ONLY.forEach((file) => {
      const text = fs.readFileSync(path.join(REPO_ROOT, file), 'utf8')

      expect({file, literals: [...text.matchAll(KEY_LITERAL)].length, holdsBlock: text.includes(block)})
        .toEqual({file, literals: 0, holdsBlock: false})
    })
  })

  it('is written out nowhere else in the repository', () => {
    // `--untracked`, so a new file counts before it is committed. `git grep` exits with 1 when nothing
    // matches. The private suite is a repository of its own, ignored by this one, so it is searched on its own.
    const listHolding = (cwd, prefix) => {
      try {
        return childProcess.execFileSync('git', ['grep', '--untracked', '-l', '-F', TEST_KEY_MARKER], {cwd, encoding: 'utf8'})
          .split('\n')
          .filter((file) => file !== '')
          .map((file) => `${prefix}${file}`)
      } catch (error) {
        if (error.status === 1) {
          return []
        }

        throw error
      }
    }
    const holding = listHolding(REPO_ROOT, '')

    if (fs.existsSync(path.join(REPO_ROOT, PRIVATE_SUITE, '.git'))) {
      holding.push(...listHolding(path.join(REPO_ROOT, PRIVATE_SUITE), `${PRIVATE_SUITE}/`))
    }

    const allowed = [...CONSTANTS, PRIVATE_SUITE_CONSTANT, ...MARKER_ONLY]

    expect(holding.filter((file) => !allowed.includes(file))).toEqual([])
  })
})
