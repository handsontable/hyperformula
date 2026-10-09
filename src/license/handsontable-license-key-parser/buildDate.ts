import { parseIsoDateToTimestamp } from './encoding';

/**
 * Turns a build release date into the bare "YYYY-MM-DD" text that
 * `release_until` is compared against.
 *
 * Accepts the "DD/MM/YYYY" form the Handsoncode build pipelines inject (for
 * example `process.env.HOT_RELEASE_DATE` or `process.env.HT_RELEASE_DATE`) and
 * an already-bare "YYYY-MM-DD". The parts are REORDERED as text and never
 * routed through a `Date`: `new Date('07/14/2025')` parses in the machine's
 * local timezone, which is exactly the kind of shift the date rules exist to
 * prevent.
 *
 * Returns an empty string when the value is missing or not a real date. Passed
 * on to `readEntitlementLicense`, an empty build date fails OPEN - a broken
 * build must never tell a paying customer that their license lapsed.
 *
 * @param {*} releaseDate The build release date, "DD/MM/YYYY" or "YYYY-MM-DD".
 * @returns {string} The date as "YYYY-MM-DD", or "" when it cannot be read.
 */
export function toIsoBuildDate(releaseDate: unknown): string {
  if (typeof releaseDate !== 'string') {
    return '';
  }

  const value = releaseDate.trim();
  const dayMonthYear = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  const isoDate = dayMonthYear === null
    ? value
    : `${dayMonthYear[3]}-${`0${dayMonthYear[2]}`.slice(-2)}-${`0${dayMonthYear[1]}`.slice(-2)}`;

  return parseIsoDateToTimestamp(isoDate) === null ? '' : isoDate;
}

/**
 * Checks the build date a caller passed in, and returns it ready to compare.
 *
 * Two different failures, two different answers:
 *
 *   - MISSING (`undefined`, `null`, an empty or blank string) fails OPEN and
 *     returns "". That is a broken build - a bundler that did not inline the
 *     release date constant - and a paying customer must never be told their
 *     license lapsed because of it.
 *   - PRESENT BUT WRONG (anything else that is not a bare, real "YYYY-MM-DD",
 *     such as the raw "DD/MM/YYYY" a build pipeline injects) throws. That is
 *     the product's bug, it is the same on every run, and failing open on it
 *     would silently turn off every `release_until` check. The product's own
 *     tests see the error on the first key they read.
 *
 * @param {*} buildDate The build date the caller passed.
 * @param {string} caller The public function name, for the error message.
 * @returns {string} The build date, or "" when it is missing.
 */
export function resolveBuildDate(buildDate: unknown, caller: string): string {
  if (buildDate === undefined || buildDate === null) {
    return '';
  }
  if (typeof buildDate === 'string' && buildDate.trim() === '') {
    return '';
  }
  if (parseIsoDateToTimestamp(buildDate) === null) {
    const got = typeof buildDate === 'string' ? `"${buildDate}"` : `a ${typeof buildDate}`;

    throw new TypeError(`${caller}: "buildDate" has to be a "YYYY-MM-DD" date, got ${got}. `
      + 'Convert a "DD/MM/YYYY" release date with toIsoBuildDate().');
  }

  return buildDate as string;
}
