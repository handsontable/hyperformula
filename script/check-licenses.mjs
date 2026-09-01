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
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Packages whose licence is allowed to appear in a production tree. */
const ALLOWED = new Set([
  'MIT', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause', 'ISC', 'BSD', 'Unlicense',
])

/** Workspaces whose production dependencies are checked. */
const WORKSPACES = ['hyperformula']

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
    out = execFileSync(bin, args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
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
    }
    collect(dep, found)
  }
  return found
}

const production = new Set()

for (const workspace of WORKSPACES) {
  collect(json('npm', ['ls', `--workspace=${workspace}`, '--omit=dev', '--all', '--json']), production)
  production.delete(`${workspace}@${json('npm', ['pkg', 'get', 'version', `--workspace=${workspace}`, '--json'])[workspace]}`)
}

// The workspace packages themselves are GPL and are not their own dependencies.
for (const workspace of WORKSPACES) {
  for (const id of [...production]) {
    if (id.startsWith(`${workspace}@`)) {
      production.delete(id)
    }
  }
}

if (production.size === 0) {
  console.error('Licence check: no production dependencies resolved. Refusing to pass vacuously.')
  process.exitCode = 1
} else {
  const licences = json('npx', ['license-checker', '--json'])
  const offenders = []

  for (const id of production) {
    const entry = licences[id]

    if (!entry) {
      offenders.push(`${id} — not found in the licence report`)
      continue
    }

    const declared = String(entry.licenses ?? '')
    const parts = declared.replace(/[()]/g, '').split(/\s+OR\s+|\s+AND\s+/).map(s => s.replace(/\*$/, '').trim())

    if (!parts.some(part => ALLOWED.has(part))) {
      offenders.push(`${id} — ${declared || 'no licence declared'}`)
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
