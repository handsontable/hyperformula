#!/usr/bin/env node
/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/*
 * Checks the vendored entitlement-key reader against the upstream it was copied from.
 *
 * `src/license/handsontable-license-key-parser/*.js` are byte-identical copies of
 * `handsontable/license-key`. A local edit silently forks the two, and a forked checksum or parser
 * rejects genuine customer keys - so the copies are verified by measurement, not by trust.
 *
 * What it does: hashes each file in that directory, fetches the same file from the branch
 * `upstream.json` tracks (`master` - the released code, not the work in progress on `develop`),
 * hashes that, and compares. Any difference is reported, in either direction: a local edit and an
 * upstream change look the same here, and both mean the copy has to be retaken.
 *
 * It compares against the BRANCH, not the recorded commit. A commit is immutable, so comparing
 * against it would pass forever and catch nothing - which is how a real change to `utils.js` sat
 * unnoticed for two days.
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

const DIR = path.resolve(__dirname, '../src/license/handsontable-license-key-parser')
const PIN = path.join(DIR, 'upstream.json')

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
  const pin = JSON.parse(fs.readFileSync(PIN, 'utf8'))
  const auth = token()

  console.log(`vendored parser: ${pin.repository}/${pin.directory} @ ${pin.track}, ${pin.files.length} files`)

  if (auth === null) {
    console.error('\nFAIL  no credentials for a private repository.')
    console.error('      Set LICENSE_KEY_REPO_TOKEN (or GH_TOKEN / GITHUB_TOKEN), or run `gh auth login`.')
    console.error('      Failing rather than skipping: an unverified copy is not a verified one.')
    process.exit(1)
  }

  const problems = []
  const hash = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex')

  for (const name of pin.files) {
    const local = path.join(DIR, name)

    if (!fs.existsSync(local)) {
      problems.push(`${name}: named in upstream.json and missing from the directory`)
      console.log(`  GONE  ${name}`)
      continue
    }

    let theirs

    try {
      theirs = hash(await fetchFile(pin.repository, `${pin.directory}/${name}`, pin.track, auth))
    } catch (error) {
      problems.push(`${name}: upstream could not be read (${error.message})`)
      console.log(`  ????  ${name}`)
      continue
    }

    const ours = hash(fs.readFileSync(local))

    if (ours === theirs) {
      console.log(`  ok    ${name}`)
    } else {
      problems.push(`${name}: this copy is ${ours}, ${pin.track} is ${theirs}`)
      console.log(`  DIFF  ${name}`)
    }
  }

  fs.readdirSync(DIR)
    .filter((name) => name.endsWith('.js') && pin.files.indexOf(name) === -1)
    .forEach((name) => problems.push(`${name}: a JavaScript file nothing in upstream.json accounts for`))

  if (problems.length === 0) {
    console.log(`\nOK - every file is byte-identical to ${pin.track}`)

    return
  }

  console.error(`\n${problems.length} problem(s):`)
  problems.forEach((problem) => console.error(`  ${problem}`))
  console.error('\nThe copies and upstream have diverged - either upstream moved, or something was')
  console.error('edited here. Re-take the files and update upstream.json in the same commit.')
  process.exit(1)
}

main().catch((error) => {
  console.error(`check failed: ${error.message}`)
  process.exit(1)
})
