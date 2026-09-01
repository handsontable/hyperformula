/**
 * Cloudflare Worker serving the built HyperFormula documentation.
 *
 * Static assets that match a request exactly are served by the Workers runtime
 * before this script runs (see `assets` in `wrangler.jsonc`). This script handles
 * only the remaining requests and reproduces the URL behaviour the documentation
 * was served with before the migration to Cloudflare:
 *
 *   - `.html` URLs are served as they are, without redirecting to an extensionless
 *     URL (guaranteed by `"html_handling": "none"`),
 *   - directory URLs (`/docs/`, `/docs/api/`) serve the directory `index.html`,
 *   - extensionless URLs (`/docs/guide/basic-usage`) serve the matching `.html` file,
 *   - a directory URL without the trailing slash (`/docs`) redirects to the
 *     canonical URL with the trailing slash,
 *   - anything else is answered with the nearest `404.html`.
 *
 * The 404 page is served here rather than through the `not_found_handling` asset
 * option on purpose: any value other than `"none"` makes the asset router answer
 * browser navigations (requests with `Sec-Fetch-Mode: navigate`) on its own, which
 * bypasses this script and turns every directory and extensionless URL into a 404.
 */

/**
 * Builds a request for the given pathname, preserving the original request otherwise.
 *
 * @param {Request} request Original request.
 * @param {URL} url Original request URL.
 * @param {string} pathname Pathname to request instead.
 * @returns {Request} Request for the rewritten pathname.
 */
const requestForPathname = (request, url, pathname) => {
  const rewritten = new URL(url)

  rewritten.pathname = pathname

  return new Request(rewritten, request)
}

/**
 * Tells whether the last segment of the pathname carries a file extension.
 *
 * @param {string} pathname Pathname to check.
 * @returns {boolean} `true` when the pathname points to a file with an extension.
 */
const hasExtension = (pathname) => pathname.split('/').pop().includes('.')

/**
 * Lists the `404.html` pathnames to look up for a request, from the closest directory upwards.
 *
 * @param {string} pathname Requested pathname.
 * @returns {string[]} Pathnames of the candidate 404 pages.
 */
const notFoundPagePathnames = (pathname) => {
  const segments = pathname.split('/').slice(1, -1)

  return segments
    .map((_, index) => `/${segments.slice(0, segments.length - index).join('/')}/404.html`)
    .concat('/404.html')
}

/**
 * Builds the response for a request that matches no document: the nearest `404.html`,
 * or a plain `404` when the build contains no 404 page at all.
 *
 * @param {Request} request Original request.
 * @param {URL} url Original request URL.
 * @param {{ ASSETS: { fetch: (request: Request) => Promise<Response> } }} env Worker bindings.
 * @returns {Promise<Response>} Response with the 404 status.
 */
const notFoundResponse = async (request, url, env) => {
  for (const pathname of notFoundPagePathnames(url.pathname)) {
    const response = await env.ASSETS.fetch(requestForPathname(request, url, pathname))

    if (response.status !== 404) {
      return new Response(response.body, { status: 404, headers: response.headers })
    }
  }

  return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

export default {
  /**
   * Serves a documentation request.
   *
   * @param {Request} request Incoming request.
   * @param {{ ASSETS: { fetch: (request: Request) => Promise<Response> } }} env Worker bindings.
   * @returns {Promise<Response>} Response with the matching document, a redirect, or the 404 page.
   */
  async fetch(request, env) {
    const url = new URL(request.url)
    const { pathname } = url

    if (pathname.endsWith('/')) {
      const indexResponse = await env.ASSETS.fetch(requestForPathname(request, url, `${pathname}index.html`))

      return indexResponse.status === 404 ? notFoundResponse(request, url, env) : indexResponse
    }

    if (!hasExtension(pathname)) {
      const documentResponse = await env.ASSETS.fetch(requestForPathname(request, url, `${pathname}.html`))

      if (documentResponse.status !== 404) {
        return documentResponse
      }

      const indexResponse = await env.ASSETS.fetch(requestForPathname(request, url, `${pathname}/index.html`))

      if (indexResponse.status !== 404) {
        const canonicalUrl = new URL(url)

        canonicalUrl.pathname = `${pathname}/`

        return Response.redirect(canonicalUrl.toString(), 301)
      }
    }

    return notFoundResponse(request, url, env)
  },
}
