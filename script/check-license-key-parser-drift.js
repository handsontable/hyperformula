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
 *   - lists the upstream directory at the pinned `commit` and compares EVERY file byte for byte
 *     against the local one as git tracks it - upstream's `diff -r`, without needing a clone;
 *   - fails on a tracked local file upstream does not have (other than `own_files`) - a shadowing
 *     `foo.ts` beside a copied `foo.ts` would otherwise win module resolution silently;
 *   - fails on an upstream file that is missing locally;
 *   - checks that the pinned `tag` still points at the pinned `commit`, so a moved tag or an edited
 *     pin does not pass as the copy it is not;
 *   - applies `allowed_divergences` - each a single exact line swap with a stated reason and expiry -
 *     to the fetched text before comparing. Tags are immutable, so this cannot see upstream fix the
 *     line on a branch; the next tag fails the check (newer-tag rule), and at the re-take the swap
 *     stops matching once upstream has changed the line, so an upstream fix cannot be missed. A tag
 *     that leaves the line alone carries the shim forward; `until` is a note, not a check;
 *   - fails when upstream has a NEWER tag than the pin: the copy is taken from releases, and a
 *     release nobody has looked at is exactly what the reviewer asked to be told about.
 *
 * Usage:  npm run check:license-key-parser-drift
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

const REPO_ROOT = path.resolve(__dirname, '..')
const DIR = path.resolve(REPO_ROOT, 'src/license/handsontable-license-key-parser')
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

/** How long a request may wait for the API before the check gives up on it. */
const REQUEST_TIMEOUT_MS = 30000

function get(apiPath, accept, auth) {
  return new Promise((resolve, reject) => {
    const request = https.get({
      hostname: 'api.github.com',
      path: apiPath,
      headers: {'Accept': accept, 'User-Agent': 'hyperformula-vendored-parser-check', 'Authorization': `Bearer ${auth}`},
      timeout: REQUEST_TIMEOUT_MS,
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
    })

    request.on('timeout', () => request.destroy(new Error(`no response within ${REQUEST_TIMEOUT_MS / 1000} s`)))
    request.on('error', reject)
  })
}

/**
 * Why a request failed, worded so that it is never mistaken for drift: a 301 is a renamed or moved
 * repository (a configuration problem), any other HTTP status is an access problem, and an error
 * with no status (a timeout, a dropped connection) is a network problem.
 */
function describeFailure(error) {
  if (error.statusCode === 301) {
    return 'HTTP 301: the repository moved or was renamed - update `repository` in upstream.json. A configuration problem, not drift'
  }
  if (error.statusCode !== undefined) {
    return `HTTP ${error.statusCode} - access, not drift`
  }

  return `${error.message} - a network problem, not drift`
}

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex')

/**
 * The `[major, minor, patch]` a tag names, or `null` for a tag that is not a version. A leading `v`
 * is ignored, and so is a prerelease suffix (`-rc.1`): a prerelease counts as newer than the pin
 * only when the version it leads up to is newer.
 */
function baseVersionOf(tag) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(tag)

  return match === null ? null : [Number(match[1]), Number(match[2]), Number(match[3])]
}

/** Whether version `a` (`[major, minor, patch]`) is greater than version `b`. */
function versionGreater(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) {
      return a[i] > b[i]
    }
  }

  return false
}

/** Every tag of an upstream repository, following the pagination, 100 per page. */
async function listTags(repo, auth) {
  const tags = []

  for (let page = 1; ; page++) {
    const batch = JSON.parse((await get(`/repos/${repo}/tags?per_page=100&page=${page}`, 'application/vnd.github+json', auth)).toString('utf8'))

    tags.push(...batch)
    if (batch.length < 100) {
      return tags
    }
  }
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

/** A path under the repository root as git spells it: relative, with forward slashes. */
const gitPath = (absolute) => path.relative(REPO_ROOT, absolute).split(path.sep).join('/')

/**
 * Every file git tracks under the local directory, recursively, relative to it. Untracked files
 * (`.DS_Store`, editor leftovers) are not part of the copy, so they are not compared.
 */
function listTracked(root) {
  const prefix = `${gitPath(root)}/`

  return execFileSync('git', ['ls-files', '-z', '--', prefix], {cwd: REPO_ROOT, encoding: 'utf8'})
    .split('\0')
    .filter((file) => file !== '')
    .map((file) => file.slice(prefix.length))
}

/**
 * A tracked file's content as git stores it (the index), not as it was checked out, so a checkout
 * that converts line endings to CRLF does not read as drift. An edit is compared once it is staged.
 */
function readTracked(root, rel) {
  return execFileSync('git', ['show', `:${gitPath(path.join(root, rel))}`], {cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024})
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

  // The pin first: a tag that moved, or a pin edited by hand, is named as that - before any
  // listing at the tag can fail for a different reason and blame access.
  try {
    const tags = await listTags(pin.repository, auth)
    const pinned = tags.find((t) => t.name === pin.tag)

    if (pinned === undefined) {
      problems.push(`tag ${pin.tag} is not among upstream's tags - the pin names a release that does not exist`)
    } else if (pinned.commit.sha !== pin.commit) {
      problems.push(`tag ${pin.tag} points at ${pinned.commit.sha.slice(0, 9)}, the pin says ${pin.commit.slice(0, 9)} - the tag moved or the pin was edited`)
    }

    const pinVersion = baseVersionOf(pin.tag)
    const newer = pinVersion === null
      ? []
      : tags.map((t) => t.name).filter((name) => {
        const version = baseVersionOf(name)

        return version !== null && versionGreater(version, pinVersion)
      })

    if (newer.length > 0) {
      problems.push(`upstream has released ${newer.join(', ')} after ${pin.tag}. Review the change and re-take the copy from the newest tag.`)
    }
  } catch (error) {
    problems.push(`could not list upstream tags: ${describeFailure(error)}`)
  }


  let upstream

  try {
    // At the pinned commit, not the tag: a tag moved after the check above cannot change what is compared.
    upstream = await listUpstream(pin.repository, pin.directory, pin.commit, auth)
  } catch (error) {
    // Whatever the pin check already found is the more likely cause of this failure - say it first.
    problems.forEach((p) => console.error(`\nFAIL  ${p}`))
    console.error(`\nFAIL  could not list ${pin.repository}/${pin.directory} at ${pin.tag}: ${describeFailure(error)}.`)
    if (error.statusCode === 404) {
      console.error('      404 from a private repository means the token has no access to it, the tag does not exist, or the directory does not exist at that ref.')
    }
    process.exit(1)
  }

  const divergences = new Map((pin.allowed_divergences || []).map((d) => [d.file, d]))
  const own = new Set(pin.own_files || [])
  const tracked = new Set(listTracked(DIR))
  const local = Array.from(tracked).filter((rel) => !own.has(rel))

  for (const [rel, apiPath] of upstream) {
    if (!tracked.has(rel)) {
      problems.push(`${rel}: in upstream at ${pin.tag}, missing here`)
      console.log(`  GONE  ${rel}`)
      continue
    }

    let theirs

    try {
      theirs = (await get(`/repos/${pin.repository}/contents/${apiPath}?ref=${encodeURIComponent(pin.commit)}`, 'application/vnd.github.raw', auth)).toString('utf8')
    } catch (error) {
      problems.push(`${rel}: upstream could not be read: ${describeFailure(error)}`)
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

    const ours = readTracked(DIR, rel)

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
