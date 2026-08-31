#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook, matched on `Edit|Write`.
 *
 * Lints the file the agent just wrote and feeds the remaining ESLint *errors*
 * back to the model (exit 2), so style and correctness rules are applied at
 * authoring time instead of surfacing at the end of the session.
 *
 * Two deliberate choices:
 *
 *   - Errors only. `npm run lint` currently reports tens of thousands of
 *     warnings across the repository; reporting them per edit would drown the
 *     model in noise unrelated to the change it just made.
 *   - `--fix-type problem,layout`. Plain `--fix` also applies suggestion-type
 *     fixes, and `jsdoc/require-jsdoc` autofixes by inserting an EMPTY JSDoc
 *     block above every undocumented declaration. Left unconstrained, the hook
 *     silently sprinkles those stubs through any source file it touches.
 *   - Fails open. Any problem with the hook itself (no ESLint binary, spawn
 *     failure, unparseable output) exits 0 and stays silent. A broken hook must
 *     never block work.
 *
 * The tool payload arrives as JSON on stdin; there is no environment variable
 * carrying the edited path.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

// npx is a .cmd shim on Windows; spawnSync needs a shell there or it ENOENTs.
const WINDOWS = process.platform === 'win32'

const LINTABLE_EXTENSIONS = new Set(['.ts', '.js'])

/** Maximum number of errors reported back to the model for a single file. */
const MAX_REPORTED_ERRORS = 20

/**
 * Reads the whole of stdin synchronously.
 *
 * @returns {string} Raw stdin contents, or an empty string when there is none.
 */
function readStdin() {
  try {
    // Read fd 0 directly - cross-platform, unlike spawning `cat`.
    return readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

/**
 * Extracts the edited file path from a PostToolUse payload.
 *
 * @param {string} rawPayload Raw JSON received on stdin.
 * @returns {string | undefined} Absolute path of the edited file, if there is one.
 */
function editedFilePath(rawPayload) {
  try {
    const payload = JSON.parse(rawPayload)
    const filePath = payload?.tool_input?.file_path

    if (typeof filePath !== 'string' || filePath.length === 0) {
      return undefined
    }

    const projectDir = process.env.CLAUDE_PROJECT_DIR ?? payload?.cwd ?? process.cwd()

    return path.resolve(projectDir, filePath)
  } catch {
    return undefined
  }
}

/**
 * Runs ESLint with `--fix` over a single file.
 *
 * @param {string} filePath Absolute path of the file to lint.
 * @returns {object[] | undefined} ESLint JSON results, or `undefined` when the run itself failed.
 */
function lintAndFix(filePath) {
  const result = spawnSync(
    'npx',
    ['--no-install', 'eslint', '--fix', '--fix-type', 'problem,layout', '--format', 'json', filePath],
    { encoding: 'utf8', shell: WINDOWS, maxBuffer: 10 * 1024 * 1024 }
  )

  // ESLint exits 1 when it reports errors, which is the case this hook exists
  // for. Anything else - a missing binary, a crash - means the run failed and
  // the hook has nothing trustworthy to say.
  if (result.error || result.status === null || result.status > 1) {
    return undefined
  }

  try {
    return JSON.parse(result.stdout)
  } catch {
    return undefined
  }
}

/**
 * Collects the ESLint messages of severity `error` from a set of results.
 *
 * @param {object[]} results ESLint JSON results.
 * @returns {object[]} The error-severity messages.
 */
function errorsOnly(results) {
  return results.flatMap(result => (result.messages ?? []).filter(message => message.severity === 2))
}

/**
 * Renders the errors as a message for the model.
 *
 * @param {string} filePath Absolute path of the linted file.
 * @param {object[]} errors The error-severity messages.
 * @returns {string} The message to write to stderr.
 */
function formatReport(filePath, errors) {
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd()
  const relativePath = path.relative(projectDir, filePath) || filePath
  const shown = errors.slice(0, MAX_REPORTED_ERRORS)
  const lines = shown.map(
    ({ line, column, message, ruleId }) => `  ${relativePath}:${line}:${column}  ${message}${ruleId ? `  (${ruleId})` : ''}`
  )

  if (errors.length > shown.length) {
    lines.push(`  ...and ${errors.length - shown.length} more.`)
  }

  return [
    `ESLint reports ${errors.length} error${errors.length === 1 ? '' : 's'} in ${relativePath} that --fix could not resolve:`,
    ...lines,
    'Fix them now. ESLint is the source of truth for formatting and code rules in this repository.',
  ].join('\n')
}

const filePath = editedFilePath(readStdin())

if (filePath === undefined || !LINTABLE_EXTENSIONS.has(path.extname(filePath))) {
  process.exit(0)
}

const results = lintAndFix(filePath)

if (results === undefined) {
  process.exit(0)
}

const errors = errorsOnly(results)

if (errors.length === 0) {
  process.exit(0)
}

process.stderr.write(`${formatReport(filePath, errors)}\n`)
process.exit(2)
