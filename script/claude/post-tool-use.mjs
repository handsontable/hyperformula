#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook, matched on `Edit|Write`.
 *
 * Lints the file the agent just wrote, applies the fixes that are unambiguously
 * safe, and reports back (exit 2) both what it changed and what it could not
 * fix, so ESLint rules are applied at authoring time instead of surfacing when
 * someone runs `npm run lint` at the end.
 *
 * Four deliberate choices:
 *
 *   - Errors only. `npm run lint` currently reports tens of thousands of
 *     warnings across the repository; reporting them per edit would drown the
 *     model in noise unrelated to the change it just made.
 *   - `--fix-type problem,layout`. Plain `--fix` also applies suggestion-type
 *     fixes, and `jsdoc/require-jsdoc` autofixes by inserting an EMPTY JSDoc
 *     block above every undocumented declaration. Left unconstrained, the hook
 *     silently sprinkles those stubs through any source file it touches.
 *   - It reports its own rewrites. `--fix` edits the file underneath the agent,
 *     which invalidates the line numbers the agent is holding; a later Edit then
 *     fails its modified-since-read check for no visible reason. Whenever the
 *     contents change, the hook says so and asks for a re-read.
 *   - It fails open. Any problem with the hook itself - no ESLint, a spawn
 *     failure, unparseable output - exits 0 and stays silent. A broken hook must
 *     never block work.
 *
 * ESLint is invoked through `node node_modules/eslint/bin/eslint.js` rather than
 * `npx`, from the project directory. That fixes the resolution of both the
 * binary and `.eslintignore` (ESLint 8 reads it relative to the working
 * directory), avoids a shell on Windows - where `shell: true` would split an
 * unquoted path containing a space into two patterns - and saves the npx
 * process on every single edit.
 *
 * The tool payload arrives as JSON on stdin; there is no environment variable
 * carrying the edited path.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

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
 * Reads a file, treating any failure as "no contents".
 *
 * @param {string} filePath Absolute path of the file.
 * @returns {string | undefined} The contents, or `undefined` when unreadable.
 */
function readFileOrUndefined(filePath) {
  try {
    return readFileSync(filePath, 'utf8')
  } catch {
    return undefined
  }
}

/**
 * Parses the PostToolUse payload.
 *
 * @param {string} rawPayload Raw JSON received on stdin.
 * @returns {{filePath: string, projectDir: string} | undefined} The edited file and the project directory.
 */
function parsePayload(rawPayload) {
  try {
    const payload = JSON.parse(rawPayload)
    const filePath = payload?.tool_input?.file_path

    if (typeof filePath !== 'string' || filePath.length === 0) {
      return undefined
    }

    const projectDir = process.env.CLAUDE_PROJECT_DIR ?? payload?.cwd ?? process.cwd()

    return { filePath: path.resolve(projectDir, filePath), projectDir }
  } catch {
    return undefined
  }
}

/**
 * Runs ESLint with `--fix` over a single file, from the project directory.
 *
 * @param {string} filePath Absolute path of the file to lint.
 * @param {string} projectDir Directory to run ESLint from.
 * @returns {object[] | undefined} ESLint JSON results, or `undefined` when the run itself failed.
 */
function lintAndFix(filePath, projectDir) {
  const eslintEntry = path.join(projectDir, 'node_modules', 'eslint', 'bin', 'eslint.js')

  if (!existsSync(eslintEntry)) {
    return undefined
  }

  const result = spawnSync(
    process.execPath,
    [eslintEntry, '--fix', '--fix-type', 'problem,layout', '--format', 'json', filePath],
    { cwd: projectDir, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  )

  // ESLint exits 1 when it reports errors, which is the case this hook exists
  // for. Anything else - a crash, a bad invocation - means the run failed and
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
 * Renders what happened as a message for the model.
 *
 * @param {string} relativePath Repository-relative path of the linted file.
 * @param {object[]} errors The error-severity messages left after fixing.
 * @param {boolean} wasRewritten Whether `--fix` changed the file on disk.
 * @returns {string} The message to write to stderr.
 */
function formatReport(relativePath, errors, wasRewritten) {
  const lines = []

  if (wasRewritten) {
    lines.push(
      `ESLint auto-fixed ${relativePath} on disk (licence header, semicolons, quotes, spacing).`,
      'The file no longer matches what you wrote, so re-read it before your next edit to it.'
    )
  }

  if (errors.length > 0) {
    if (wasRewritten) {
      lines.push('')
    }
    lines.push(`${errors.length} error${errors.length === 1 ? '' : 's'} remain in ${relativePath} that --fix could not resolve:`)
    lines.push(...errors.slice(0, MAX_REPORTED_ERRORS).map(
      ({ line, column, message, ruleId }) => `  ${relativePath}:${line}:${column}  ${message}${ruleId ? `  (${ruleId})` : ''}`
    ))

    if (errors.length > MAX_REPORTED_ERRORS) {
      lines.push(`  ...and ${errors.length - MAX_REPORTED_ERRORS} more.`)
    }

    lines.push('Fix them now. ESLint is the source of truth for formatting and code rules in this repository.')
  }

  return lines.join('\n')
}

const payload = parsePayload(readStdin())

if (payload === undefined || !LINTABLE_EXTENSIONS.has(path.extname(payload.filePath))) {
  process.exit(0)
}

const { filePath, projectDir } = payload
const before = readFileOrUndefined(filePath)
const results = lintAndFix(filePath, projectDir)

if (results === undefined) {
  process.exit(0)
}

const errors = errorsOnly(results)
const after = readFileOrUndefined(filePath)
const wasRewritten = before !== undefined && after !== undefined && before !== after

if (errors.length === 0 && !wasRewritten) {
  process.exit(0)
}

const relativePath = path.relative(projectDir, filePath) || filePath

// Not process.exit(): stderr is a pipe here, pipe writes are asynchronous, and
// process.exit() does not wait for them, which truncates or drops the report.
process.stderr.write(`${formatReport(relativePath, errors, wasRewritten)}\n`)
process.exitCode = 2
