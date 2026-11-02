import type {
  ProductEntitlement,
  LicenseLifecycle,
  LicenseState,
  LicenseChannels,
  LicenseTimeReference,
} from './types';
import { parseIsoDateToTimestamp } from './encoding';
import { resolveBuildDate } from './buildDate';
import {
  TRIAL_FLAG,
  NO_CONSOLE_WARNS_FLAG,
  NO_UI_WARNS_FLAG,
  MILLISECONDS_PER_DAY,
} from './constants';

/**
 * The window a `usage_until` license is in, before the trial flag decides how
 * it is worded.
 */
type UsageWindow = 'valid' | 'notice' | 'soft_stop' | 'hard_stop';

/**
 * The UTC midnight of the day an instant falls on. Every window boundary is a
 * UTC midnight, so both sides of every comparison are snapped to one - the
 * local calendar, the locale and DST are inputs the classification must not
 * read at all.
 *
 * @param {number} timestamp The instant, in epoch milliseconds.
 * @returns {number}
 */
function utcMidnightOf(timestamp: number): number {
  return Math.floor(timestamp / MILLISECONDS_PER_DAY) * MILLISECONDS_PER_DAY;
}

/**
 * Whole UTC days from today until the last licensed day. `0` on the last
 * licensed day (which is still licensed in full) and negative once it has
 * passed. Both sides are UTC midnights, so the count is a whole number of
 * calendar days and never a rounded fraction.
 *
 * @param {number} expiryTimestamp The UTC midnight of the last licensed day.
 * @param {number} now The current instant, in epoch milliseconds.
 * @returns {number}
 */
function daysUntil(expiryTimestamp: number, now: number): number {
  return (expiryTimestamp - utcMidnightOf(now)) / MILLISECONDS_PER_DAY;
}

/**
 * Places a `usage_until` license in its window.
 *
 * The named day is licensed in full: the license runs until the UTC midnight
 * that FOLLOWS it, and the grace period is measured from there. A `notice` of
 * `0` means no advance warning at all, so the notice window is empty rather
 * than one day long.
 *
 * @param {number} expiryTimestamp The UTC midnight of the last licensed day.
 * @param {ProductEntitlement} entitlement The product entry the windows come from.
 * @param {number} now The current instant, in epoch milliseconds.
 * @returns {UsageWindow}
 */
function resolveUsageWindow(
  expiryTimestamp: number,
  entitlement: ProductEntitlement,
  now: number,
): UsageWindow {
  const expiryBoundary = expiryTimestamp + MILLISECONDS_PER_DAY;

  if (now >= expiryBoundary) {
    return now < expiryBoundary + (entitlement.grace * MILLISECONDS_PER_DAY) ? 'soft_stop' : 'hard_stop';
  }

  const daysRemaining = daysUntil(expiryTimestamp, now);

  return entitlement.notice > 0 && daysRemaining <= entitlement.notice ? 'notice' : 'valid';
}

/**
 * Classifies one product entitlement into its lifecycle facet.
 *
 * Which of the two dates the entry carries decides how it is measured; the
 * `trial` flag decides only what the user is told. Nothing here branches on a
 * contract type, because the payload does not carry one.
 *
 * A `release_until` entry never reads `time.now`, and a `usage_until` entry
 * never compares against `time.buildDate`. The build date is checked either
 * way, so a wrong one fails on the first key a product's tests read, whatever
 * its kind - see `resolveBuildDate`.
 *
 * Pass an entry from `extractEntitlementKeyData` / `getProductEntitlement`. An
 * entry that is not a verified one - no date, both dates, a date that is not a
 * real "YYYY-MM-DD" string - throws rather than being guessed at.
 *
 * @param {ProductEntitlement} entitlement The verified product entry.
 * @param {LicenseTimeReference} time The time references to measure against.
 * @returns {LicenseLifecycle}
 */
export function classifyEntitlement(
  entitlement: ProductEntitlement,
  time: LicenseTimeReference,
): LicenseLifecycle {
  const buildDate = resolveBuildDate(time.buildDate, 'classifyEntitlement');
  const isTrial = entitlement.flags.indexOf(TRIAL_FLAG) !== -1;
  const releaseUntil = entitlement.release_until;
  const usageUntil = entitlement.usage_until;
  // Read without turning the value into text first: `['2027-08-12']` would
  // stringify to a valid date.
  const releaseTimestamp = parseIsoDateToTimestamp(releaseUntil);
  const usageTimestamp = parseIsoDateToTimestamp(usageUntil);

  if ((releaseTimestamp === null) === (usageTimestamp === null)) {
    throw new TypeError('classifyEntitlement: the entry has to carry exactly one valid date. '
      + 'Pass an entry read by extractEntitlementKeyData().');
  }

  if (releaseTimestamp !== null) {
    // Fail OPEN when the build release date is missing (a bundler consuming
    // the source without the build-time define step, a broken build): a paying
    // customer must never be told their license lapsed because of a build
    // defect. The comparison as text is exact because both sides are
    // "YYYY-MM-DD".
    const covered = buildDate === '' || (releaseUntil as string) >= buildDate;

    return Object.freeze({
      state: covered ? 'release_valid' : 'release_expired',
      isTrial,
      daysRemaining: null,
      licensedUntil: releaseUntil as string,
    });
  }

  const expiryTimestamp = usageTimestamp as number;
  const window = resolveUsageWindow(expiryTimestamp, entitlement, time.now);

  return Object.freeze({
    state: `${isTrial ? 'trial' : 'usage'}_${window}` as LicenseState,
    isTrial,
    daysRemaining: daysUntil(expiryTimestamp, time.now),
    licensedUntil: usageUntil as string,
  });
}

/**
 * Reads which notification channels a product entitlement leaves open. Both
 * flags are per product and default to open; a key issued for external,
 * end-user-facing use carries both.
 *
 * @param {ProductEntitlement} entitlement The verified product entry.
 * @returns {LicenseChannels}
 */
export function resolveChannels(entitlement: ProductEntitlement): LicenseChannels {
  return Object.freeze({
    console: entitlement.flags.indexOf(NO_CONSOLE_WARNS_FLAG) === -1,
    ui: entitlement.flags.indexOf(NO_UI_WARNS_FLAG) === -1,
  });
}
