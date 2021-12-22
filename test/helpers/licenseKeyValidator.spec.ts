import {HyperFormula} from '../../src'
import {LicenseKeyValidityState} from '../../src/helpers/licenseKeyValidator'

describe('license key', () => {
  describe('valid key', () => {
    it('should verify "gpl-v3" as a valid license key', () => {
      const [hf] = HyperFormula.buildEmpty({
        licenseKey: 'gpl-v3',
      })

      expect(hf.licenseKeyValidityState).toEqual(LicenseKeyValidityState.VALID)
    })

    it('should verify "internal-use-in-handsontable" as a valid license key', () => {
      const [hf] = HyperFormula.buildEmpty({
        licenseKey: 'internal-use-in-handsontable',
      })

      expect(hf.licenseKeyValidityState).toEqual(LicenseKeyValidityState.VALID)
    })
  })

  describe('invalid key', () => {
    it('should verify "gpl" as an invalid license key', () => {
      const [hf] = HyperFormula.buildEmpty({
        licenseKey: 'gpl-v1',
      })

      expect(hf.licenseKeyValidityState).toEqual(LicenseKeyValidityState.INVALID)
    })

    it('should verify license keys correctnes', () => {
      const [hf] = HyperFormula.buildEmpty({
        licenseKey: '11111-11111-11111-11111-11111',
      })

      expect(hf.licenseKeyValidityState).toEqual(LicenseKeyValidityState.INVALID)
    })
  })

  describe('missing key', () => {
    it('should verify an empty string as an invalid license key', () => {
      const [hf] = HyperFormula.buildEmpty({
        licenseKey: '',
      })

      expect(hf.licenseKeyValidityState).toEqual(LicenseKeyValidityState.MISSING)
    })
  })

  describe('expired key', () => {
    xit('should verify that key is expired', () => {
      const [hf] = HyperFormula.buildEmpty({
        licenseKey: '80584-cc272-2e7c4-06f16-4db00',
      })

      expect(hf.licenseKeyValidityState).toEqual(LicenseKeyValidityState.EXPIRED)
    })
  })
})
