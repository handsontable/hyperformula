#!/usr/bin/env node
/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/*
 * Checks the vendored entitlement-key reader against the upstream sources it was ported from.
 *
 * `src/license/handsontable-license-key-parser/` mirrors `handsontable/license-key`. A local-only
 * fix there silently forks the two copies, and a forked checksum or parser rejects genuine
 * customer keys - so the pin has to be verified by measurement, not by someone remembering to look.
 *
 * What it does: reads `upstream.lock.json`, fetches each upstream file from the branch it tracks
 * (`master` - the released code, not the work in progress on `develop`), and compares its sha256
 * against the recorded one. A mismatch means upstream moved on while this port stayed behind.
 *
 * It deliberately does NOT fetch at the pinned commit. A commit is immutable, so that check would
 * pass forever and catch nothing - which is how a real change to `utils.js` sat unnoticed for two
 * days. The pin is what we compare against; the branch is what we compare.
 *
 * What it deliberately does NOT do: compare our files to upstream byte for byte. They are
 * TypeScript ports of JavaScript sources - `allowJs` is off and `strict` is on - so their bytes
 * cannot match, and a check that pretended otherwise would fail for a reason that is never drift.
 * PROVENANCE.md lists the shape differences a reviewer should expect.
 *
 * Usage:
 *   npm run check:vendored-parser
 *
 * Needs read access to a private repository. Provide a token through any of
 * LICENSE_KEY_REPO_TOKEN, GH_TOKEN or GITHUB_TOKEN, or be logged in to the `gh` CLI. Without one
 * the check FAILS rather than passing quietly: "could not verify" is not "verified".
 */

'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const https = require('https')
const {execFileSync} = require('child_process')

const LOCK = path.resolve(__dirname, '../src/license/handsontable-license-key-parser/upstream.lock.json')

function token() {
  const fromEnv = process.env.LICENSE_KEY_REPO_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN

  if (fromEnv) {
    return fromEnv
  }

  try {
    return execFileSync('gh', ['auth', 'token'], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim()
  } catch (error) {
    return null
  }
}

function fetchFile(repo, filePath, ref, auth) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${repo}/contents/${filePath}?ref=${encodeURIComponent(ref)}`,
      headers: {
        'Accept': 'application/vnd.github.raw',
        'User-Agent': 'hyperformula-vendored-parser-check',
        'Authorization': `Bearer ${auth}`,
      },
    }

    https.get(options, (response) => {
      const chunks = []

      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => {
        if (response.statusCode !== 200) {
          // The body of a failed call can echo the request back. Report the status and the path only.
          reject(new Error(`GET ${filePath}@${ref} answered ${response.statusCode}`))

          return
        }
        resolve(Buffer.concat(chunks))
      })
    }).on('error', reject)
  })
}

async function main() {
  const lock = JSON.parse(fs.readFileSync(LOCK, 'utf8'))
  const auth = token()

  console.log(`vendored parser: pinned to ${lock.repository}@${lock.commit}, checked against ${lock.track}`)

  if (auth === null) {
    console.error('\nFAIL  no credentials for a private repository.')
    console.error('      Set LICENSE_KEY_REPO_TOKEN (or GH_TOKEN / GITHUB_TOKEN), or run `gh auth login`.')
    console.error('      Failing rather than skipping: an unverified pin is not a verified one.')
    process.exit(1)
  }

  const problems = []

  for (const entry of lock.files) {
    const upstreamPath = `${lock.directory}/${entry.upstream}`
    let actual

    try {
      const body = await fetchFile(lock.repository, upstreamPath, lock.track, auth)

      actual = crypto.createHash('sha256').update(body).digest('hex')
    } catch (error) {
      problems.push(`${entry.upstream}: could not be read (${error.message})`)
      console.log(`  ????  ${entry.upstream}`)
      continue
    }

    if (actual === entry.sha256) {
      console.log(`  ok    ${entry.upstream}`)
    } else {
      problems.push(`${entry.upstream}: ${lock.track} is ${actual}, the pin says ${entry.sha256}`)
      console.log(`  DRIFT ${entry.upstream}`)
    }

    const vendored = path.resolve(path.dirname(LOCK), entry.vendored)

    if (!fs.existsSync(vendored)) {
      problems.push(`${entry.vendored}: named in the lock file and missing from the directory`)
    }
  }

  const vendoredFiles = fs.readdirSync(path.dirname(LOCK)).filter((name) => name.endsWith('.ts'))
  const pinned = lock.files.map((entry) => entry.vendored)

  vendoredFiles.filter((name) => pinned.indexOf(name) === -1).forEach((name) => {
    problems.push(`${name}: present in the directory and named nowhere in the lock file, so nothing pins it`)
  })

  if (problems.length === 0) {
    console.log(`\nOK - ${lock.track} still matches the pin`)

    return
  }

  console.error(`\n${problems.length} problem(s):`)
  problems.forEach((problem) => console.error(`  ${problem}`))
  console.error(`\nUpstream ${lock.track} has moved on, or the directory and the pin disagree.`)
  console.error('Re-port the changed file and update upstream.lock.json in the same commit.')
  process.exit(1)
}

main().catch((error) => {
  console.error(`check failed: ${error.message}`)
  process.exit(1)
})
