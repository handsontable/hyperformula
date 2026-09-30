/**
 * The length of the checksum (SHA-512 as hex) which postfixes the payload
 * inside the machine-readable block of every entitlement license key.
 *
 * @type {number}
 */
export const ENTITLEMENT_KEY_CHECKSUM_LENGTH = 128;
/**
 * The two mutually exclusive date fields of a product entry. Exactly one of
 * them has to be present:
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
