#!/usr/bin/env node
/**
 * Asserts that every production dependency of the published packages carries a
 * permissive licence.
 *
 * `license-checker --production` cannot do this in an npm workspace. It reads
 * `<start>/node_modules`, and npm hoists the engine's dependencies to the
 * repository root, so started in `hyperformula/` it finds an empty tree and
 * started at the root it finds a manifest with no dependencies of its own -
 * either way it reports zero packages and passes vacuously.
 *
 * So the production set comes from `npm ls --omit=dev`, which resolves through
 * the hoisting correctly, and the licence data comes from a full
 * `license-checker` run over the root tree, which is what knows how to read a
 * LICENSE file when the manifest field is missing.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Packages whose licence is allowed to appear in a production tree. */
const ALLOWED = new Set([
  'MIT', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause', 'ISC', 'BSD', 'Unlicense',
])

/**
 * Workspaces whose production dependencies are checked, by path: a name such as
 * `hyperformula-ui` would also match the folder of that name and every package in it.
 */
const WORKSPACES = ['hyperformula', 'hyperformula-ui/packages/core']

/**
 * Runs a command and parses its stdout as JSON.
 *
 * @param {string[]} args Arguments for npm or npx.
 * @param {string} bin Executable to run.
 * @returns {object} The parsed JSON.
 */
function json(bin, args) {
  // `npm ls` exits non-zero on any tree warning, so read stdout regardless.
  let out = ''
  try {
    // npm and npx are .cmd shims on Windows, which Node launches only through a shell.
    out = execFileSync(bin, args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: process.platform === 'win32' })
  } catch (error) {
    out = error.stdout ?? ''
  }
  return JSON.parse(out)
}

/**
 * Collects every package in a production dependency tree as `name@version`.
 *
 * @param {object} node A node of the `npm ls --json` tree.
 * @param {Set<string>} found Accumulator.
 * @returns {Set<string>} The accumulator.
 */
function collect(node, found = new Set()) {
  for (const [name, dep] of Object.entries(node.dependencies ?? {})) {
    if (dep.version) {
      found.add(`${name}@${dep.version}`)
    } else if (dep.missing) {
      // Declared but not installed: no licence can be read for it, so it must fail.
      found.add(`${name}@(not installed)`)
    }
    collect(dep, found)
  }
  return found
}

/**
 * Decides whether a licence expression lets the package ship under the allowlist.
 *
 * Evaluated as SPDX: `OR` is satisfied by either side, `AND` only by both, `AND`
 * binds tighter than `OR`, and parentheses group. `X WITH exception` counts as
 * `X`. A trailing `*` marks a licence license-checker guessed from a file, and is
 * ignored. license-checker reports a package that lists several licences in the
 * legacy `licenses` field as an array, which that field means as alternatives,
 * so an array reads as `OR`. Anything malformed or empty is not permitted.
 *
 * @param {string|string[]|undefined} licenses The `licenses` value of a report entry.
 * @returns {boolean} Whether the package may ship.
 */
function isPermitted(licenses) {
  const expression = Array.isArray(licenses) ? licenses.join(' OR ') : String(licenses ?? '')
  const tokens = expression.match(/[()]|[^\s()]+/g) ?? []
  let position = 0

  const term = () => {
    const token = tokens[position++]

    if (token === '(') {
      const value = either()

      if (tokens[position++] !== ')') {
        throw new Error('unbalanced parentheses')
      }
      return value
    }
    if (token === undefined || token === ')' || token === 'AND' || token === 'OR') {
      throw new Error('licence expected')
    }
    if (tokens[position] === 'WITH') {
      position += 2
    }
    return ALLOWED.has(token.replace(/\*$/, ''))
  }
  const both = () => {
    let value = term()

    while (tokens[position] === 'AND') {
      position++
      value = term() && value
    }
    return value
  }
  const either = () => {
    let value = both()

    while (tokens[position] === 'OR') {
      position++
      value = both() || value
    }
    return value
  }

  try {
    const value = either()

    return position === tokens.length && value
  } catch {
    return false
  }
}

const production = new Set()

for (const workspace of WORKSPACES) {
  collect(json('npm', ['ls', `--workspace=${workspace}`, '--omit=dev', '--all', '--json']), production)
}

// The workspace packages themselves are not their own dependencies.
for (const workspace of WORKSPACES) {
  const { name } = JSON.parse(readFileSync(path.join(REPO_ROOT, workspace, 'package.json'), 'utf8'))

  for (const id of [...production]) {
    if (id.startsWith(`${name}@`)) {
      production.delete(id)
    }
  }
}

if (production.size === 0) {
  console.error('Licence check: no production dependencies resolved. Refusing to pass vacuously.')
  process.exitCode = 1
} else {
  const licences = json('npx', ['--no-install', 'license-checker', '--json'])
  const offenders = []

  for (const id of production) {
    const entry = licences[id]

    if (!entry) {
      offenders.push(`${id} — not found in the licence report`)
      continue
    }

    if (!isPermitted(entry.licenses)) {
      offenders.push(`${id} — ${[].concat(entry.licenses ?? []).join(', ') || 'no licence declared'}`)
    }
  }

  if (offenders.length > 0) {
    console.error(`Licence check: ${offenders.length} production dependency/dependencies are not permissively licensed:`)
    offenders.forEach(line => console.error(`  ${line}`))
    process.exitCode = 1
  } else {
    console.log(`Licence check: OK — ${production.size} production dependencies, all permissively licensed.`)
  }
}
