#!/usr/bin/env node
/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/*
 * Holds `src/license/handsontable-license-key-parser/` to the upstream directory it is a copy of.
 *
 * The directory is `handsontable/license-key`'s `vendor/entitlement-key-reader/`, taken whole from
 * a tagged release, as upstream's own integration guide prescribes ("copy the whole directory,
 * from a tagged release, and do not edit the copy ... add a drift check to CI"). This is that check.
 *
 * What it does, per `upstream.json`:
 *   - lists the upstream directory at the pinned `tag` and compares EVERY file byte for byte
 *     against the local one - upstream's `diff -r`, without needing a clone;
 *   - fails on a local file upstream does not have (other than `own_files`) - a shadowing
 *     `foo.ts` beside a copied `foo.ts` would otherwise win module resolution silently;
 *   - fails on an upstream file that is missing locally;
 *   - applies `allowed_divergences` - each a single exact line swap with a stated reason and expiry -
 *     to the fetched text before comparing. If upstream changes that line, the swap no longer
 *     matches and the check fails, so a shim cannot outlive the bug it works around;
 *   - fails when upstream has a NEWER tag than the pin: the copy is taken from releases, and a
 *     release nobody has looked at is exactly what the reviewer asked to be told about.
 *
 * Usage:  npm run check:vendored-parser
 *
 * Needs read access to a private repository: LICENSE_KEY_REPO_TOKEN, GH_TOKEN, GITHUB_TOKEN, or
 * a logged-in `gh`. Without one it FAILS - "could not verify" is not "verified" - and a 401/403/404
 * is reported as an access problem, not as drift.
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

function get(apiPath, accept, auth) {
  return new Promise((resolve, reject) => {
    https.get({
      hostname: 'api.github.com',
      path: apiPath,
      headers: {'Accept': accept, 'User-Agent': 'hyperformula-vendored-parser-check', 'Authorization': `Bearer ${auth}`},
    }, (response) => {
      const chunks = []

      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => {
        const body = Buffer.concat(chunks)

        if (response.statusCode === 200) {
          resolve(body)
        } else {
          const error = new Error(`${response.statusCode}`)

          error.statusCode = response.statusCode
          reject(error)
        }
      })
    }).on('error', reject)
  })
}

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex')

function semverGreater(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) {
      return (pa[i] || 0) > (pb[i] || 0)
    }
  }

  return false
}

/** Every file under an upstream directory at a ref, recursively, as `relative path -> api path`. */
async function listUpstream(repo, dir, ref, auth) {
  const out = new Map()
  const walk = async(sub) => {
    const listing = JSON.parse((await get(`/repos/${repo}/contents/${sub}?ref=${encodeURIComponent(ref)}`, 'application/vnd.github+json', auth)).toString('utf8'))

    for (const entry of listing) {
      const rel = entry.path.slice(dir.length + 1)

      if (entry.type === 'dir') {
        await walk(entry.path)
      } else {
        out.set(rel, entry.path)
      }
    }
  }

  await walk(dir)

  return out
}

/** Every file under the local directory, recursively, relative. */
function listLocal(root) {
  const out = []
  const walk = (sub) => {
    fs.readdirSync(path.join(root, sub), {withFileTypes: true}).forEach((entry) => {
      const rel = sub ? `${sub}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        walk(rel)
      } else {
        out.push(rel)
      }
    })
  }

  walk('')

  return out
}

async function main() {
  const pin = JSON.parse(fs.readFileSync(PIN, 'utf8'))
  const auth = token()

  console.log(`vendored reader: ${pin.repository}/${pin.directory} @ ${pin.tag}`)

  if (auth === null) {
    console.error('\nFAIL  no credentials for a private repository.')
    console.error('      Set LICENSE_KEY_REPO_TOKEN (or GH_TOKEN / GITHUB_TOKEN), or run `gh auth login`.')
    console.error('      Failing rather than skipping: an unverified copy is not a verified one.')
    process.exit(1)
  }

  const problems = []
  let upstream

  try {
    upstream = await listUpstream(pin.repository, pin.directory, pin.tag, auth)
  } catch (error) {
    console.error(`\nFAIL  could not list ${pin.repository}/${pin.directory} at ${pin.tag}: HTTP ${error.message}.`)
    console.error(error.statusCode === 404
      ? '      404 from a private repository means the token has no access to it, or the tag does not exist. This is not drift.'
      : '      This is an access or network problem, not drift.')
    process.exit(1)
  }

  const divergences = new Map((pin.allowed_divergences || []).map((d) => [d.file, d]))
  const own = new Set(pin.own_files || [])
  const local = listLocal(DIR).filter((rel) => !own.has(rel))

  for (const [rel, apiPath] of upstream) {
    const localPath = path.join(DIR, rel)

    if (!fs.existsSync(localPath)) {
      problems.push(`${rel}: in upstream at ${pin.tag}, missing here`)
      console.log(`  GONE  ${rel}`)
      continue
    }

    let theirs

    try {
      theirs = (await get(`/repos/${pin.repository}/contents/${apiPath}?ref=${encodeURIComponent(pin.tag)}`, 'application/vnd.github.raw', auth)).toString('utf8')
    } catch (error) {
      problems.push(`${rel}: upstream could not be read (HTTP ${error.message}) - access, not drift`)
      console.log(`  ????  ${rel}`)
      continue
    }

    const shim = divergences.get(rel)

    if (shim) {
      const occurrences = theirs.split(shim.upstream).length - 1

      if (occurrences !== 1) {
        problems.push(`${rel}: the allowed divergence no longer matches upstream (line found ${occurrences} times). Upstream moved - drop the shim and re-take the file.`)
        console.log(`  SHIM? ${rel}`)
        continue
      }
      theirs = theirs.replace(shim.upstream, shim.local)
    }

    const ours = fs.readFileSync(localPath, 'utf8')

    if (sha256(Buffer.from(ours)) === sha256(Buffer.from(theirs))) {
      console.log(`  ok    ${rel}${shim ? '   (1 allowed divergence applied)' : ''}`)
    } else {
      problems.push(`${rel}: differs from upstream at ${pin.tag}`)
      console.log(`  DIFF  ${rel}`)
    }
  }

  local.filter((rel) => !upstream.has(rel)).forEach((rel) => {
    problems.push(`${rel}: exists here and not in upstream - a local file in this directory shadows or extends the copy; move it out`)
    console.log(`  EXTRA ${rel}`)
  })

  try {
    const tags = JSON.parse((await get(`/repos/${pin.repository}/tags?per_page=20`, 'application/vnd.github+json', auth)).toString('utf8'))
    const newer = tags.map((t) => t.name).filter((name) => /^\d+\.\d+\.\d+$/.test(name) && semverGreater(name, pin.tag))

    if (newer.length > 0) {
      problems.push(`upstream has released ${newer.join(', ')} after ${pin.tag}. Review the change and re-take the copy from the newest tag.`)
    }
  } catch (error) {
    problems.push(`could not list upstream tags (HTTP ${error.message}) - access, not drift`)
  }

  if (problems.length === 0) {
    console.log(`\nOK - the directory is upstream's ${pin.directory} at ${pin.tag}, byte for byte${divergences.size ? `, with ${divergences.size} declared divergence(s)` : ''}`)

    return
  }

  console.error(`\n${problems.length} problem(s):`)
  problems.forEach((p) => console.error(`  ${p}`))
  process.exit(1)
}

main().catch((error) => {
  console.error(`check failed: ${error.message}`)
  process.exit(1)
})
