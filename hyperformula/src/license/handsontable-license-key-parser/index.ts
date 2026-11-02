/**
 * The entitlement license key reader - the part of `handsontable/license-key`
 * that products copy into their own source tree.
 *
 * Copy this whole directory. Do not edit the copy: change the original in
 * `handsontable/license-key` (`vendor/entitlement-key-reader/`) and copy it
 * again. See `README.md` in this directory.
 */
import { detectLicenseKeyFormat, isEntitlementKey } from './detectFormat';
import {
  extractEntitlementKeyData,
  validateEntitlementKey,
  getProductEntitlement,
} from './extractKeyData';
import { classifyEntitlement, resolveChannels } from './classify';
import {
  UNRESTRICTED_GRANTS,
  getLicenseGrants,
  hasProductGrant,
  getProductCapabilities,
  hasCapability,
} from './grants';
import { readEntitlementLicense } from './readLicense';
import { toIsoBuildDate } from './buildDate';
import {
  TRIAL_FLAG,
  NO_CONSOLE_WARNS_FLAG,
  NO_UI_WARNS_FLAG,
  CUSTOM_FLAG,
} from './constants';

export type {
  LicenseKeyFormat,
  ProductEntitlement,
  EntitlementKeyData,
  LicenseState,
  LicenseLifecycle,
  LicenseChannels,
  LicenseGrants,
  LicenseTimeReference,
  UnlicensedReason,
  EntitlementLicense,
  ReadEntitlementLicenseOptions,
} from './types';

export {
  // The one call a product needs.
  readEntitlementLicense,
  toIsoBuildDate,
  // Routing a key to the right validator.
  detectLicenseKeyFormat,
  isEntitlementKey,
  // The building blocks `readEntitlementLicense` is made of.
  extractEntitlementKeyData,
  validateEntitlementKey,
  getProductEntitlement,
  classifyEntitlement,
  resolveChannels,
  // Capability gating.
  UNRESTRICTED_GRANTS,
  getLicenseGrants,
  hasProductGrant,
  getProductCapabilities,
  hasCapability,
  // The flag names, for a product that reads one directly.
  TRIAL_FLAG,
  NO_CONSOLE_WARNS_FLAG,
  NO_UI_WARNS_FLAG,
  CUSTOM_FLAG,
};
