/**
 * The shapes a license key string can have. `literal` is one of the plain words
 * the calling product accepts as a key (for example
 * "non-commercial-and-evaluation" or "gpl-v3") - which words those are is the
 * product's decision, so the reader only recognizes the ones it is handed.
 * Only "entitlement" is read by this module; every other format is the
 * product's own path.
 */
export type LicenseKeyFormat =
  | 'entitlement'
  | 'legacy'
  | 'literal'
  | 'unknown';

/**
 * What one product entry of a verified key grants. Exactly one of
 * `usage_until` / `release_until` is present - the pair replaces the contract
 * type, which the payload does not carry. `notice` and `grace` are the warning
 * and soft-stop windows, in days, and arrive in the key rather than living in
 * the library. Unknown extra fields survive verification untouched, so a field
 * added to the format later stays visible to the layers above.
 *
 * Read-only: the verified data is frozen and shared between callers. Copy an
 * array (`capabilities.slice()`) before sorting or changing it.
 */
export interface ProductEntitlement {
  readonly capabilities: readonly string[];
  readonly usage_until?: string;
  readonly release_until?: string;
  readonly notice: number;
  readonly grace: number;
  readonly flags: readonly string[];
  readonly [field: string]: unknown;
}

/**
 * The machine-readable data of a verified entitlement license key: what it
 * grants, keyed by product name. Presence means licensed. A product the reader
 * does not know is kept and ignored - one install can be licensed for one
 * product and not for another, and the unknown one must not take down the
 * known ones.
 */
export interface EntitlementKeyData {
  /**
   * The format version of the key: 1 for a key without `v` in its payload
   * (the first keys), the value of `v` otherwise. The checksum and the shape
   * are verified for every version. The prose is verified only from version
   * 2: a version 1 key reads with an edited prose, as its bare block, or with
   * text after the block, exactly as it did when it was issued. A product may
   * use the number to decide how to treat such a key.
   */
  readonly version: number;
  readonly products: { readonly [productName: string]: ProductEntitlement };
}

/**
 * The lifecycle state of a license, derived from the governing date of the
 * product entry:
 *
 *   - `usage_until` runs the notice -> soft stop -> hard stop windows against
 *     the current UTC instant. The `trial_*` states are the same windows on a
 *     key carrying the `trial` flag - they differ in what the user is told and
 *     shown, not in how they are measured.
 *   - `release_until` compares the build release date against the maintenance
 *     date as text. No clock takes part, so the verdict never changes.
 */
export type LicenseState =
  | 'usage_valid'
  | 'usage_notice'
  | 'usage_soft_stop'
  | 'usage_hard_stop'
  | 'trial_valid'
  | 'trial_notice'
  | 'trial_soft_stop'
  | 'trial_hard_stop'
  | 'release_valid'
  | 'release_expired';

/**
 * The lifecycle facet of a license: the state, whether the key is a trial, the
 * whole UTC days left until the last licensed day (`null` when no clock is
 * involved), and the governing date as the bare "YYYY-MM-DD" string the
 * payload carries. The date is never re-derived from a timestamp - the string
 * in the key is what the messages print.
 */
export interface LicenseLifecycle {
  readonly state: LicenseState;
  readonly isTrial: boolean;
  readonly daysRemaining: number | null;
  readonly licensedUntil: string | null;
}

/**
 * Which notification channels the license leaves open. A product entry may
 * carry `no-console-warns` (nothing reaches the console) and `no-ui-warns` (no
 * WARNING is rendered in the UI); both are the default for a key issued for
 * external, end-user-facing use.
 *
 * `ui` governs warnings only. A trial hard-stop block is enforcement and is
 * applied regardless - see `NO_UI_WARNS_FLAG` in `./constants`. A new surface
 * reading this field has to decide which of the two it is before honoring it.
 */
export interface LicenseChannels {
  readonly console: boolean;
  readonly ui: boolean;
}

/**
 * What a license unlocks. `unrestricted` is the fallback shortcut - every query
 * answers "granted" for it, so the same API serves keys outside the
 * entitlement format (unlock everything) and entitlement keys (unlock exactly
 * the tokens the payload lists) without the caller branching on the key
 * family.
 */
export interface LicenseGrants {
  readonly unrestricted: boolean;
  readonly products: { readonly [productName: string]: { readonly capabilities: readonly string[] } };
}

/**
 * The time references a license is measured against: the current instant for a
 * `usage_until` entitlement, and the build release date (as the bare
 * "YYYY-MM-DD" text it is compared to) for a `release_until` one. The build
 * date is text on purpose - the maintenance check is static against static, so
 * it holds on a machine with no clock and cannot disagree between two
 * timezones.
 */
export interface LicenseTimeReference {
  now: number;
  buildDate: string | null | undefined;
}

/**
 * Why an entitlement key does not license the product that reads it:
 *
 *   - `unreadable`       the key fails verification: the block is missing,
 *                        tampered with or malformed, or - for a version 2
 *                        key - the prose was edited or removed (the prose
 *                        digest covers it) or text other than whitespace
 *                        follows the block. A version 1 key never covered
 *                        its prose, so neither makes it unreadable,
 *   - `product_missing`  the key is intact but grants other products only.
 *
 * Both are reported to the user as an invalid key; the split exists so a
 * product can log which one it was.
 */
export type UnlicensedReason = 'unreadable' | 'product_missing';

/**
 * The result of reading an entitlement key for one product.
 *
 * When `licensed` is `true`, `entitlement`, `lifecycle` and `channels` describe
 * that product and `grants` lists exactly what the key unlocks.
 *
 * `version` is the format version of the key (1 for a key without `v`, whose
 * prose is not checked) whenever the key could be read - also for
 * `product_missing`. It is `null` only for an unreadable key, and the union
 * narrows it: check `reason` and `version` is a `number` or `null`.
 *
 * When `licensed` is `false`, the product must report an invalid key.
 * `entitlement` and `lifecycle` are `null`, both channels are open (the flags
 * that close them could not be read), and `grants` is unrestricted - an
 * invalid key nags, it never takes features away.
 *
 * The whole result is frozen, in both cases.
 */
export type EntitlementLicense =
  | {
    readonly licensed: true;
    readonly reason: null;
    readonly version: number;
    readonly entitlement: ProductEntitlement;
    readonly lifecycle: LicenseLifecycle;
    readonly channels: LicenseChannels;
    readonly grants: LicenseGrants;
  }
  | {
    readonly licensed: false;
    readonly reason: 'product_missing';
    readonly version: number;
    readonly entitlement: null;
    readonly lifecycle: null;
    readonly channels: LicenseChannels;
    readonly grants: LicenseGrants;
  }
  | {
    readonly licensed: false;
    readonly reason: 'unreadable';
    readonly version: null;
    readonly entitlement: null;
    readonly lifecycle: null;
    readonly channels: LicenseChannels;
    readonly grants: LicenseGrants;
  };

/**
 * What the calling product tells `readEntitlementLicense`.
 */
export interface ReadEntitlementLicenseOptions {
  /** The product name this build reads its own license from (e.g. "hyperformula"). */
  product: string;
  /**
   * The build release date, as a bare "YYYY-MM-DD" (`toIsoBuildDate` converts
   * "DD/MM/YYYY"). Compared against `release_until` keys only. A missing value
   * (`undefined`, `null`, "") fails OPEN; any other value that is not a real
   * "YYYY-MM-DD" throws - see `resolveBuildDate`.
   */
  buildDate: string | null | undefined;
  /** The current instant, in epoch milliseconds. Defaults to `Date.now()`. */
  now?: number;
}
