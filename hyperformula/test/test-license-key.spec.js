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
const PRIVATE_SUITE_CONSTANT = 'hyperformula/test/hyperformula-tests/performance/testLicenseKey.ts'

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

  it('is written out nowhere else in the repository', () => {
    // `--untracked`, so a new file counts before it is committed. `git grep` exits with 1 when nothing
    // matches.
    const listHolding = () => {
      try {
        return childProcess.execFileSync('git', ['grep', '--untracked', '-l', '-F', TEST_KEY_MARKER], {cwd: REPO_ROOT, encoding: 'utf8'})
      } catch (error) {
        if (error.status === 1) {
          return ''
        }

        throw error
      }
    }
    const holding = listHolding().split('\n').filter((file) => file !== '')

    expect(holding.filter((file) => !CONSTANTS.includes(file) && !MARKER_ONLY.includes(file))).toEqual([])
  })
})
