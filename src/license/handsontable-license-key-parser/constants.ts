/**
 * The length of the checksum (SHA-512 as hex) that closes the machine-readable
 * block of every entitlement license key.
 *
 * @type {number}
 */
export const CHECKSUM_LENGTH = 128;

/**
 * The two mutually exclusive date fields of a product entry. Exactly one of
 * them is present:
 *
 *   - "usage_until"   the last licensed day (inclusive, compared in UTC),
 *   - "release_until" builds released on or before that day may be used
 *                     forever (compared against the build release date as
 *                     text, no clock involved).
 *
 * The pair replaces the contract type - nothing in the payload says
 * "subscription" or "perpetual".
 *
 * @type {string[]}
 */
export const DATE_FIELDS = ['usage_until', 'release_until'];

/**
 * Marks a license as an evaluation one. It changes how a license is WORDED and
 * whether the hard stop blocks the product - never how its dates are measured.
 * A flag is present or absent - there is no `false` value - and an
 * unrecognized flag is ignored, for the same reason an unrecognized capability
 * token is.
 *
 * @type {string}
 */
export const TRIAL_FLAG = 'trial';

/**
 * Closes the console channel: nothing the license has to say reaches it.
 *
 * @type {string}
 */
export const NO_CONSOLE_WARNS_FLAG = 'no-console-warns';

/**
 * Closes the UI WARNING surfaces (a banner, a badge, a popover). Both this flag
 * and the one above are the default for a key issued for external,
 * end-user-facing use.
 *
 * It does NOT close the trial hard-stop block. The block is enforcement rather
 * than a warning. This is a product decision (DEV-2709, Handsontable); the
 * specification's S4.1 table header does not yet record the split, so do not
 * "restore" the other reading from the spec alone.
 *
 * @type {string}
 */
export const NO_UI_WARNS_FLAG = 'no-ui-warns';

/**
 * Marks an individually negotiated key. Reserved - it changes nothing a reader
 * does today, and is listed only so a reader knows the name is taken.
 *
 * @type {string}
 */
export const CUSTOM_FLAG = 'custom';

/**
 * The number of milliseconds in a day, used to walk from one UTC midnight to
 * the next.
 *
 * @type {number}
 */
export const MILLISECONDS_PER_DAY = 86400000;
