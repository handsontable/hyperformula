/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

/**
 * Vendored from `handsontable/license-key`, `src/typed-key/default-schema.js`.
 * See `src/license/vendor/PROVENANCE.md` before editing — this file is a port, not original code.
 */

import {deepFreeze} from './utils'

/**
 * One key type of the typed-key schema: its tag, the legal wording it is spelled with, and
 * whether it carries an expiration date and a hard stop.
 *
 * Only `tag` is read while parsing a key. The remaining fields describe the human-readable prose
 * and are used at generation, which HyperFormula never does; they are kept so this file stays a
 * faithful copy of the upstream vocabulary and so drift is detectable by hashing.
 */
export interface TypedKeyTypeDefinition {
  readonly tag: string,
  readonly legalClauses: readonly string[],
  readonly expiryWording: string,
  readonly expires: boolean,
  readonly hasHardStop: boolean,
}

/**
 * One product of the typed-key schema. The keys of `scopeWordings` are the tier vocabulary of
 * that product (or `'tier:mode'` pairs for a product with deployment modes), and the keys of
 * `addonWordings` are its add-on vocabulary — that is where HyperFormula's
 * `freemium | crm | data_grid | excel_simulator` tiers and `spreadsheet | import_export` add-ons
 * are defined.
 */
export interface TypedKeyProductDefinition {
  readonly name: string,
  readonly displayName: string,
  readonly modes?: readonly string[],
  readonly defaultMode?: string,
  readonly scopeWordings: Readonly<Record<string, string>>,
  readonly addonWordings?: Readonly<Record<string, string>>,
}

/**
 * The typed-key schema: the marketing-owned vocabulary of the license keys.
 */
export interface TypedKeySchema {
  readonly keyTypes: Readonly<Record<string, TypedKeyTypeDefinition>>,
  /** ARRAY, not a map — the order is the priority order used to pick the licensed product. */
  readonly products: readonly TypedKeyProductDefinition[],
}

/**
 * The default typed-key schema: the marketing-owned vocabulary of the license keys. The schema
 * describes WHAT can be licensed (products, tiers, modes, add-ons) and HOW it is worded in the
 * human-readable part of the key (legal clauses, scope wordings, expiry wordings).
 *
 * The engine (generate/validate/extract) only defines the key FORMAT — the type tag, the
 * prose/payload structure, the checksum, the version stamping, and the strict validation rules.
 *
 * Compatibility rules that matter to a reader such as HyperFormula:
 * - key type names and tags are append-only — renaming or removing one makes already-issued keys
 *   of that type unreadable;
 * - product names are append-only for the same reason (the expiration time is derived from the
 *   first schema product found in the payload);
 * - wordings and legal clauses may change freely — they only affect newly generated keys,
 *   already-issued keys stay valid (the checksum covers whatever prose they were born with).
 *
 * It is deeply frozen so it cannot be mutated in place.
 */
export const DEFAULT_TYPED_KEY_SCHEMA: TypedKeySchema = deepFreeze<TypedKeySchema>({
  // Every key type defines its tag, its legal wording (the "{PRODUCT}" placeholder is replaced
  // with the licensed product display name), the beginning of the expiration clause, and two
  // flags: "expires" (does the key carry an expiration date) and "hasHardStop" (does it stop
  // working "grace" days after the expiration - such keys require the grace period in the
  // payload).
  keyTypes: {
    trial: {
      tag: '[TRIAL]',
      legalClauses: [
        'is_granted_for_evaluation_only',
        'Use_in_production_is_not_permitted',
        'Please_report_misuse_to_legal@handsontable.com',
        'For_purchasing_contact_sales@handsontable.com',
      ],
      expiryWording: 'This_key_will_deactivate_on',
      expires: true,
      hasHardStop: true,
    },
    freemium: {
      tag: '[FREE]',
      legalClauses: [
        'is_granted_under_the_Free_plan',
        'Use_is_subject_to_the_{PRODUCT}_Free_License_Terms',
        'Features_beyond_the_Free_plan_require_a_commercial_license',
        'To_upgrade_contact_sales@handsontable.com',
      ],
      expiryWording: 'This_key_does_not_expire',
      expires: false,
      hasHardStop: false,
    },
    subscription: {
      tag: '[SUB]',
      legalClauses: [
        'is_granted_under_a_subscription_license',
        'Use_after_expiry_is_not_permitted_per_the_subscription_agreement',
        'To_renew_contact_sales@handsontable.com',
      ],
      expiryWording: 'This_key_will_deactivate_on',
      expires: true,
      hasHardStop: true,
    },
    perpetual: {
      tag: '[PERP]',
      legalClauses: [
        'is_granted_under_a_perpetual_license',
        'Access_to_new_versions_ends_when_maintenance_expires',
        'Versions_released_before_that_date_may_be_used_indefinitely',
        'To_renew_maintenance_contact_sales@handsontable.com',
      ],
      expiryWording: 'Maintenance_ends_on',
      expires: true,
      hasHardStop: false,
    },
  },
  // The products, in priority order: the FIRST product of this list found in the payload is the
  // "licensed product" - it carries the expiration date and the grace period, and its display
  // name is spelled in the key header.
  //
  // Every product defines its scope wordings (tier, or "tier:mode" when the product supports
  // deployment modes) and optionally its add-on wordings.
  products: [
    {
      name: 'handsontable',
      displayName: 'Handsontable',
      modes: ['internal', 'saas'],
      defaultMode: 'internal',
      scopeWordings: {
        freemium: 'Free',
        'enterprise:internal': 'Enterprise',
        'enterprise:saas': 'Enterprise_SaaS',
      },
    },
    {
      name: 'hyperformula',
      displayName: 'HyperFormula',
      scopeWordings: {
        freemium: 'HyperFormula_Free',
        crm: 'HyperFormula_CRM',
        data_grid: 'HyperFormula_Data_Grid',
        excel_simulator: 'HyperFormula_Excel_Simulator',
      },
      addonWordings: {
        spreadsheet: 'Spreadsheet_addon',
        import_export: 'Import_Export_addon',
      },
    },
  ],
})

/**
 * The name of HyperFormula's own product entry in the typed-key payload. Note this is NOT
 * necessarily the *licensed* product of a key: a key that grants both Handsontable and
 * HyperFormula carries its expiration date on the Handsontable entry, because that product comes
 * first in {@link DEFAULT_TYPED_KEY_SCHEMA}'s priority order.
 */
export const HYPERFORMULA_PRODUCT_NAME = 'hyperformula'
