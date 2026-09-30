import { ENTITLEMENT_KEY_CHECKSUM_LENGTH, DATE_FIELDS } from './constants';
import { sha512 } from './sha512';
import { base64ToString, parseIsoDate, stringToUtf8Bytes } from './utils';

/**
 * The alphabet of the encoded payload - URL-safe base64 without padding.
 * The checksum (lowercase hex) is a subset of it, which is what lets the two
 * be split by a fixed length from the right.
 *
 * @type {RegExp}
 */
const ENCODED_PAYLOAD = /^[A-Za-z0-9\-_]+$/;
const CHECKSUM = /^[0-9a-f]+$/;

/**
 * Returns `true` when the value is a plain object.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Returns `true` when the value is a non-negative integer.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isNonNegativeInteger(value) {
  return typeof value === 'number' && Number.isFinite(value) && Math.floor(value) === value && value >= 0;
}

/**
 * Returns `true` when the value is an array of strings.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/**
 * Returns `true` when the value is a real calendar date in the "YYYY-MM-DD"
 * format. A time component, an offset, a numeric timestamp and a date that
 * does not exist are all rejected - the format is the whole contract, and a
 * validator that accepted two spellings would hide a timezone bug at
 * generation instead of surfacing it.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isIsoDate(value) {
  try {
    parseIsoDate(value, 'license');

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Adds an own, ordinary property.
 *
 * Both the product names and the field names of a product entry come from
 * JSON, so "__proto__" is a name an attacker can put in a key. A plain
 * assignment would go through the Object.prototype setter: the value would
 * vanish from Object.keys while still resolving through the chain.
 *
 * @param {object} target The object to add the property to.
 * @param {string} key The property name.
 * @param {*} value The property value.
 */
function defineOwn(target, key, value) {
  Object.defineProperty(target, key, {
    value, enumerable: true, writable: true, configurable: true,
  });
}

/**
 * Verifies and normalizes one product entry.
 *
 * Strict about SHAPE: exactly one of the two dates, a real date, and the two
 * window sizes. A key that gets this wrong is malformed, not merely unknown,
 * and reading it would mean guessing what was licensed.
 *
 * Lenient about VOCABULARY: an unrecognised capability token, an unrecognised
 * flag and an unrecognised extra field are all kept and ignored. Without that
 * leniency every token added on the issuing side would break every library
 * version already deployed in the field.
 *
 * Returns `null` when the entry is malformed.
 *
 * @param {*} entry The product entry of the payload.
 * @returns {object|null}
 */
function normalizeProductEntry(entry) {
  if (!isPlainObject(entry)) {
    return null;
  }
  if (!isStringArray(entry.capabilities)) {
    return null;
  }

  const presentDateFields = DATE_FIELDS.filter((field) => entry[field] !== undefined);

  // Exactly one date per product. "Both" and "neither" are each a different
  // commercial shape that the format cannot express, so neither may be
  // silently resolved by whichever field the parser happens to read first.
  if (presentDateFields.length !== 1) {
    return null;
  }
  if (!isIsoDate(entry[presentDateFields[0]])) {
    return null;
  }
  if (!isNonNegativeInteger(entry.notice) || !isNonNegativeInteger(entry.grace)) {
    return null;
  }
  if (entry.flags !== undefined && !isStringArray(entry.flags)) {
    return null;
  }

  // Start from everything the entry carries, so a field this version does not
  // know survives into the result instead of being silently dropped. A field
  // added to the format later is exactly the case an already-vendored parser
  // has to survive, and a reader that quietly discards it makes the field
  // invisible to the application on top.
  const normalized = {};

  Object.keys(entry).forEach((field) => defineOwn(normalized, field, entry[field]));

  defineOwn(normalized, 'capabilities', entry.capabilities.slice());
  defineOwn(normalized, 'notice', entry.notice);
  defineOwn(normalized, 'grace', entry.grace);
  // An absent array and an empty one mean the same thing. Normalizing here
  // keeps `flags.indexOf('trial')` safe at every call site.
  defineOwn(normalized, 'flags', entry.flags === undefined ? [] : entry.flags.slice());
  defineOwn(normalized, presentDateFields[0], entry[presentDateFields[0]]);

  return normalized;
}

/**
 * Extracts the machine-readable data from an entitlement license key.
 *
 * The checksum is verified first, so the returned data is guaranteed to
 * belong to an intact block. For a malformed or tampered key `null` is
 * returned - reporting an invalid key is the caller's job, not this
 * function's.
 *
 * Only the bracketed block matters. The prose in front of it is neither
 * parsed nor covered by the checksum, so the caller may pass the whole
 * artifact or just the `[...]` block, and rewrapped or re-pasted text still
 * validates.
 *
 * No schema is needed. Unknown products, capabilities and flags are all
 * tolerated, so nothing about reading a key depends on the vocabulary - which
 * is what lets a product vendor this parser on its own.
 *
 * @param {string} licenseKey The license key to extract the data from.
 * @returns {{ products: object }|null} The granted products, each with its
 *          capabilities, its single date (`usage_until` or `release_until`),
 *          its `notice` and `grace` windows in days, and its `flags`.
 */
/* eslint-disable import/prefer-default-export */
export function extractEntitlementKeyData(licenseKey) {
  if (typeof licenseKey !== 'string') {
    return null;
  }

  // The machine-readable block closes the key. Searching backwards means a
  // bracket inside the prose cannot shadow it.
  const blockStart = licenseKey.lastIndexOf('[');

  if (blockStart === -1) {
    return null;
  }

  const blockEnd = licenseKey.indexOf(']', blockStart);

  if (blockEnd === -1) {
    return null;
  }

  const content = licenseKey.slice(blockStart + 1, blockEnd);

  if (content.length <= ENTITLEMENT_KEY_CHECKSUM_LENGTH) {
    return null;
  }

  const encodedPayload = content.slice(0, -ENTITLEMENT_KEY_CHECKSUM_LENGTH);
  const checksum = content.slice(-ENTITLEMENT_KEY_CHECKSUM_LENGTH);

  if (!ENCODED_PAYLOAD.test(encodedPayload) || !CHECKSUM.test(checksum)) {
    return null;
  }
  if (sha512(stringToUtf8Bytes(encodedPayload)) !== checksum) {
    return null;
  }

  const payloadJson = base64ToString(encodedPayload);

  if (payloadJson === null) {
    return null;
  }

  let payload;

  try {
    payload = JSON.parse(payloadJson);
  } catch (error) {
    return null;
  }

  if (!isPlainObject(payload) || !isPlainObject(payload.products)) {
    return null;
  }

  const products = {};
  let malformed = false;

  Object.keys(payload.products).forEach((name) => {
    const entry = normalizeProductEntry(payload.products[name]);

    if (entry === null) {
      malformed = true;

      return;
    }

    defineOwn(products, name, entry);
  });

  if (malformed) {
    return null;
  }

  return { products };
}
