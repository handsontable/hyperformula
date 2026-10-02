import type {
  EntitlementLicense,
  LicenseChannels,
  ReadEntitlementLicenseOptions,
  UnlicensedReason,
} from './types';
import { extractEntitlementKeyData, getProductEntitlement } from './extractKeyData';
import { classifyEntitlement, resolveChannels } from './classify';
import { UNRESTRICTED_GRANTS, getLicenseGrants } from './grants';
import { resolveBuildDate } from './buildDate';

/**
 * Both notification channels open - what a key gets when its flags could not
 * be read.
 *
 * @type {LicenseChannels}
 */
const OPEN_CHANNELS: LicenseChannels = Object.freeze({ console: true, ui: true });

/**
 * Builds the result for a key that does not license the product.
 *
 * @param {UnlicensedReason} reason Why the key does not license the product.
 * @returns {EntitlementLicense}
 */
function unlicensed(reason: UnlicensedReason): EntitlementLicense {
  return Object.freeze({
    licensed: false,
    reason,
    entitlement: null,
    lifecycle: null,
    channels: OPEN_CHANNELS,
    grants: UNRESTRICTED_GRANTS,
  });
}

/**
 * Reads an entitlement license key for one product, in one call: verifies the
 * block, picks the product's entry, places it in its lifecycle window, reads
 * its silencing flags and resolves what it unlocks.
 *
 * This is the single entry point a product needs. Route a key here only when
 * `detectLicenseKeyFormat` says "entitlement" - legacy and literal keys are
 * the product's own path.
 *
 * A key that grants other products but not this one is NOT a license for this
 * product, however many others it grants. It reads as `licensed: false` with
 * the reason `product_missing`, and the product reports it as an invalid key.
 * Another product's entry never invalidates the key on its own: one install
 * can be licensed for one product and not for another.
 *
 * The grants of an unlicensed key stay UNRESTRICTED on purpose. An invalid key
 * nags - it does not strip features - so introducing capability gating can
 * never take a feature away from a customer whose key failed to read.
 *
 * The clock is read only for a `usage_until` entry, and only when `now` is not
 * passed. A `release_until` entry never reads it.
 *
 * A missing build date fails OPEN; a build date that is present but not a
 * bare "YYYY-MM-DD" throws - see `resolveBuildDate`. Both are checked before
 * the key is read, so the error shows whatever key a product's tests use.
 *
 * The result is frozen, whichever way it goes.
 *
 * @param {string} licenseKey The license key, as the user supplied it.
 * @param {ReadEntitlementLicenseOptions} options What the product tells the reader.
 * @param {string} options.product The product name this build reads its license from.
 * @param {string} options.buildDate The build release date, "YYYY-MM-DD".
 * @param {number} [options.now] The current instant, in epoch milliseconds.
 * @returns {EntitlementLicense}
 */
export function readEntitlementLicense(
  licenseKey: string,
  options: ReadEntitlementLicenseOptions,
): EntitlementLicense {
  // A wrong argument is the product's bug, not the customer's, so it throws -
  // a silent "invalid" would make every key look broken with no clue why.
  if (options === null || typeof options !== 'object') {
    throw new TypeError('readEntitlementLicense: pass the options - { product, buildDate, now? }.');
  }

  const { product, now } = options;
  const buildDate = resolveBuildDate(options.buildDate, 'readEntitlementLicense');

  if (typeof product !== 'string' || product === '') {
    throw new TypeError('readEntitlementLicense: "product" has to be a non-empty product name.');
  }
  if (now !== undefined && (typeof now !== 'number' || !Number.isFinite(now))) {
    throw new TypeError('readEntitlementLicense: "now" has to be epoch milliseconds.');
  }

  const keyData = extractEntitlementKeyData(licenseKey);

  if (keyData === null) {
    return unlicensed('unreadable');
  }

  const entitlement = getProductEntitlement(keyData, product);

  if (entitlement === null) {
    return unlicensed('product_missing');
  }

  // The clock is read once, so every window boundary is measured against the
  // same instant, and only for a `usage_until` entry - a `release_until` one
  // never reads it (fixture J9), so it gets a value nothing looks at.
  let currentTime = NaN;

  if (entitlement.usage_until !== undefined) {
    currentTime = now === undefined ? Date.now() : now;
  }

  const lifecycle = classifyEntitlement(entitlement, { now: currentTime, buildDate });

  return Object.freeze({
    licensed: true,
    reason: null,
    entitlement,
    lifecycle,
    channels: resolveChannels(entitlement),
    grants: getLicenseGrants(keyData),
  });
}
