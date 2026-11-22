/**
 * The license key every test engine is built with. An engine built without a valid key returns
 * `#LIC!` from every function, so tests read the key from here and a new key is a one-line change.
 * `bootstrap.ts` makes it the default `licenseKey`. A test of the license behavior itself keeps its
 * own literal key.
 *
 * The key is the HyperFormula internal test key, issued with `npm run generate-internal-test-key` in the
 * private `license-key` package. Its text says in capitals that it is not licensed for production, and it
 * works for builds released on or before 2036-11-04: renew it before then. Every test-key constant holds
 * the same key, which `hyperformula-tests/unit/license/test-license-key.spec.js` in the private suite checks.
 */
// eslint-disable-next-line max-len
export const TEST_LICENSE_KEY = 'This is a HyperFormula license key for HYPERFORMULA INTERNAL TEST KEY, issued on 2026-11-04 for the "NOT FOR PRODUCTION USE" project. It includes 1 test license: > 1. INTERNAL TEST KEY for the HyperFormula test suites, for builds released on or before 2036-11-04 (UTC). NOT LICENSED FOR PRODUCTION OR ANY OTHER USE. [eyJwcm9kdWN0cyI6eyJoeXBlcmZvcm11bGEiOnsiY2FwYWJpbGl0aWVzIjpbImNvcmUiLCJmdW46YWxsIiwiZmVhdDphbGwiXSwicmVsZWFzZV91bnRpbCI6IjIwMzYtMTEtMDQiLCJub3RpY2UiOjAsImdyYWNlIjowLCJmbGFncyI6W119fSwidiI6MiwicHJvc2UiOiJjNjBlM2YwYmYxMTM1NmY1NTg4YTFmOTJkMTMwMjNjOWNkYWZkMGQzYjRlYzEzYmZmMDk0NzEzOWQyMmMxNTI1In0e3f3891dea5cec8dc06c990f027a63916b73ff80b0d3ec191892a8ce881ea64162381590fc6417968aebe4204460621b0fa841bc44dc79622c79bca422288191]'
