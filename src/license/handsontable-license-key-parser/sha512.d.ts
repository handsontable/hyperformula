/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Hand-written declarations for `sha512.js`, which is a verbatim copy of upstream.
 * See PROVENANCE.md: the JavaScript is not edited here, so the types live beside it.
 */

/**
 * SHA-512 of the given bytes, as lower-case hexadecimal. Self-contained so the module needs no
 * dependency and works on a plain `http://` page, where `crypto.subtle` is unavailable.
 *
 * @param {number[]|Uint8Array} bytes - the message, as byte values
 */
export function sha512(bytes: number[] | Uint8Array): string
