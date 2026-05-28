#!/usr/bin/env node
/**
 * Extracts the HyperFormula public API surface at a given git ref (or from
 * the current working tree when --ref is omitted).
 *
 * Used by the prep-flip T2.5 tier (cross-repo contract check) to detect
 * breaking changes between develop and a PR HEAD.
 *
 * Usage:
 *   node extract-public-api.js [--ref <sha|branch>]
 *
 * Output (stdout): { exports: ApiExport[], lint_scope: string[] }
 *
 * @typedef {{ file: string, name: string, kind: string,
 *             required_params: string[], optional_params: string[] }} ApiExport
 * @typedef {{ exports: ApiExport[], lint_scope: string[] }} ApiSurface
 */
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const refIdx = args.indexOf('--ref');
/** @type {string|null} */
const ref = refIdx !== -1 ? (args[refIdx + 1] ?? null) : null;

// ---------------------------------------------------------------------------
// Source-reading helpers — git show at ref OR filesystem fallback
// ---------------------------------------------------------------------------

/**
 * Read a repo-relative file either at the given git ref or from the working
 * tree.  Returns null when the file cannot be found at either location.
 *
 * @param {string} repoRelPath  e.g. "src/index.ts"
 * @returns {string|null}
 */
function readFile(repoRelPath) {
  if (ref) {
    try {
      return execSync(`git show "${ref}:${repoRelPath}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch {
      // Fall through to working-tree read below.
    }
  }
  // Working-tree fallback: resolve relative to the repo root.
  try {
    const repoRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    const absPath = path.join(repoRoot, repoRelPath);
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Parameter-list parsing helpers
// ---------------------------------------------------------------------------

/**
 * Split a parameter-list string on top-level commas, respecting angle-bracket
 * and parenthesis nesting for generic types like `Map<string, number>`.
 *
 * @param {string} str
 * @returns {string[]}
 */
function splitParams(str) {
  /** @type {string[]} */
  const parts = [];
  let depth = 0;
  let current = '';
  for (const ch of str) {
    if ('<([{'.includes(ch)) depth += 1;
    else if ('>)]}' .includes(ch)) depth -= 1;
    else if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/**
 * Parse a raw parameter string into required/optional name lists.
 *
 * @param {string|null|undefined} paramStr
 * @returns {{ required: string[], optional: string[] }}
 */
function parseParams(paramStr) {
  if (!paramStr || !paramStr.trim()) return { required: [], optional: [] };
  const required = /** @type {string[]} */ ([]);
  const optional = /** @type {string[]} */ ([]);
  for (const raw of splitParams(paramStr)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    // Strip TypeScript access modifiers (constructor injection pattern).
    const clean = trimmed.replace(/^(private|public|protected|readonly|\s)+/, '');
    // Extract parameter name (before `:`, `?`, `=`, or rest `...`).
    const nameMatch = clean.match(/^\.{3}?(\w+)/);
    const paramName = nameMatch
      ? nameMatch[1]
      : (clean.split(/[?:=\s]/)[0] ?? '').trim();
    if (!paramName) continue;
    // Optional when the name fragment contains `?` or a default `=` precedes `:`.
    const beforeColon = clean.split(':')[0] ?? '';
    const isOptional = beforeColon.includes('?') || beforeColon.includes('=');
    if (isOptional) {
      optional.push(paramName.replace('?', ''));
    } else {
      required.push(paramName);
    }
  }
  return { required, optional };
}

// ---------------------------------------------------------------------------
// src/index.ts — named export extraction
// ---------------------------------------------------------------------------

/**
 * Extract all public exports from src/index.ts:
 *   - `export { X, Y }` or `export { X, Y } from '...'`  → kind 'unknown'
 *   - `export class X ...`                                 → kind 'class'
 *   - `export function X(...)`                             → kind 'function'
 *   - `export type/interface/enum X ...`                   → kind 'type'
 *
 * @param {string} src
 * @returns {ApiExport[]}
 */
function extractIndexExports(src) {
  if (!src) return [];
  /** @type {ApiExport[]} */
  const indexExports = [];

  // Named export blocks (with or without `from`), multiline-safe via [\s\S].
  // Matches: export { A, B, C } [from '...']
  const namedExportRe = /export\s*\{([\s\S]*?)\}(?:\s*from\s*['"][^'"]+['"])?/g;
  let m;
  while ((m = namedExportRe.exec(src)) !== null) {
    const names = m[1]
      .split(',')
      .map(n => n.trim().replace(/\/\/[^\n]*/g, '').trim()) // strip inline comments
      .map(n => n.split(/\s+as\s+/).pop()?.trim())
      .filter(n => n && /^\w/.test(n));
    for (const name of names) {
      if (!indexExports.some(e => e.name === name)) {
        indexExports.push({
          file: 'src/index.ts',
          name: /** @type {string} */ (name),
          kind: 'unknown',
          required_params: [],
          optional_params: [],
        });
      }
    }
  }

  // Direct exports: export class X / export function X(...) / export type X
  const directClassRe = /export\s+(?:abstract\s+)?class\s+(\w+)/g;
  while ((m = directClassRe.exec(src)) !== null) {
    const name = m[1];
    if (!indexExports.some(e => e.name === name)) {
      indexExports.push({ file: 'src/index.ts', name, kind: 'class', required_params: [], optional_params: [] });
    }
  }

  const directFnRe = /export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
  while ((m = directFnRe.exec(src)) !== null) {
    const name = m[1];
    const params = parseParams(m[2]);
    if (!indexExports.some(e => e.name === name)) {
      indexExports.push({
        file: 'src/index.ts',
        name,
        kind: 'function',
        required_params: params.required,
        optional_params: params.optional,
      });
    }
  }

  const directTypeRe = /export\s+(?:type|interface|enum)\s+(\w+)/g;
  while ((m = directTypeRe.exec(src)) !== null) {
    const name = m[1];
    if (!indexExports.some(e => e.name === name)) {
      indexExports.push({ file: 'src/index.ts', name, kind: 'type', required_params: [], optional_params: [] });
    }
  }

  return indexExports;
}

// ---------------------------------------------------------------------------
// src/HyperFormula.ts — public method + constructor extraction
// ---------------------------------------------------------------------------

/**
 * Extract the HyperFormula constructor signature and all public instance/static
 * methods from src/HyperFormula.ts.
 *
 * @param {string|null} src
 * @returns {ApiExport[]}
 */
function extractHyperFormulaExports(src) {
  if (!src) return [];
  /** @type {ApiExport[]} */
  const exports = [];

  // Constructor
  const ctorMatch = src.match(/\bconstructor\s*\(([^)]*)\)/);
  if (ctorMatch) {
    const params = parseParams(ctorMatch[1]);
    exports.push({
      file: 'src/HyperFormula.ts',
      name: 'HyperFormula.constructor',
      kind: 'constructor',
      required_params: params.required,
      optional_params: params.optional,
    });
  }

  // Public (static) (async) (get|set) methodName(params)
  const methodRe =
    /(?:^|\n)[ \t]+public\s+(static\s+)?(async\s+)?(?:(?:get|set)\s+)?(\w[\w]*)\s*\(([^)]*)\)/g;
  let m;
  while ((m = methodRe.exec(src)) !== null) {
    const name = m[3];
    if (name === 'constructor') continue;
    if (name.startsWith('_')) continue; // private-by-convention

    const isStatic = !!m[1];
    const params = parseParams(m[4]);
    exports.push({
      file: 'src/HyperFormula.ts',
      name: isStatic ? `HyperFormula.${name}` : `HyperFormula#${name}`,
      kind: isStatic ? 'static-method' : 'method',
      required_params: params.required,
      optional_params: params.optional,
    });
  }

  return exports;
}

// ---------------------------------------------------------------------------
// tsconfig.json — lint_scope extraction
// ---------------------------------------------------------------------------

/**
 * Derive the lint scope from tsconfig.json `include` patterns.
 * Returns an array of top-level directory prefixes, e.g. `['src', 'test']`.
 *
 * @returns {string[]}
 */
function extractLintScope() {
  const tsconfigSrc = readFile('tsconfig.json');
  if (!tsconfigSrc) return ['src'];
  try {
    // tsconfig uses JSON5-ish syntax — strip single-line comments before parsing.
    const stripped = tsconfigSrc.replace(/\/\/[^\n]*/g, '');
    const tsconfig = JSON.parse(stripped);
    const include = Array.isArray(tsconfig.include) ? tsconfig.include : ['src'];
    return include
      .map(p =>
        String(p)
          .replace(/\/\*\*.*/, '')
          .replace(/\/\*.*/, '')
          .replace(/\/$/, ''),
      )
      .filter(p => p.length > 0);
  } catch {
    return ['src'];
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const indexSrc = readFile('src/index.ts');
const hfSrc = readFile('src/HyperFormula.ts');

/** @type {ApiExport[]} */
const apiExports = [
  ...extractIndexExports(indexSrc ?? ''),
  ...extractHyperFormulaExports(hfSrc),
];

/** @type {string[]} */
const lint_scope = extractLintScope();

/** @type {ApiSurface} */
const result = { exports: apiExports, lint_scope };

process.stdout.write(JSON.stringify(result) + '\n');
