/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Vendored from `handsontable/license-key`, `src/typed-key/constants.js`.
 * See `src/license/vendor/PROVENANCE.md` before editing — this file is a port, not original code.
 */

/**
 * The typed license key format versions this library can read. The version is stamped into the
 * key payload (the `v` field) at generation and checked automatically at extraction — the format
 * version describes HOW the key is parsed (envelope, encoding, checksum), unlike the schema,
 * which describes WHAT the key grants. When a new format version ships, it is ADDED here (with
 * per-version handling where needed) so one build keeps reading all the already-issued keys.
 */
export const TYPED_KEY_SUPPORTED_VERSIONS: number[] = [1]

/**
 * The length of the checksum (SHA-512 as hex) which postfixes every typed license key.
 */
export const TYPED_KEY_CHECKSUM_LENGTH = 128
