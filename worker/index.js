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
 *   - anything else falls through to the asset router, which returns the nearest
 *     `404.html`.
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
      return env.ASSETS.fetch(requestForPathname(request, url, `${pathname}index.html`))
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

    return env.ASSETS.fetch(request)
  },
}
