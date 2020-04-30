import { HyperFormula } from '../../src'
import { LicenseKeyValidityState } from '../../src/helpers/licenseKeyValidator'

describe('license key', () => {
  let consoleSpy: jasmine.Spy

  beforeAll(() => {
    consoleSpy = spyOn(console, 'warn')
  })

  afterAll(() => {
    expect(consoleSpy).toHaveBeenCalledTimes(1)
    expect(consoleSpy.calls.argsFor(0)[0]).toMatch(/The license key for HyperFormula is/)
  })

  describe('valid key', () => {
    it('should verify "agpl-v3" as a valid license key', () => {
      const hf = HyperFormula.buildEmpty({
        licenseKey: 'agpl-v3',
      })

      expect(hf.getConfig().licenseKeyValidityState).toEqual(LicenseKeyValidityState.VALID)
    })

    it('should verify "internal-use-in-handsontable" as a valid license key', () => {
      const hf = HyperFormula.buildEmpty({
        licenseKey: 'internal-use-in-handsontable',
      })

      expect(hf.getConfig().licenseKeyValidityState).toEqual(LicenseKeyValidityState.VALID)
    })

    it('should verify "non-commercial-and-evaluation" as a valid license key', () => {
      const hf = HyperFormula.buildEmpty({
        licenseKey: 'non-commercial-and-evaluation',
      })

      expect(hf.getConfig().licenseKeyValidityState).toEqual(LicenseKeyValidityState.VALID)
    })
  })

  describe('invalid key', () => {
    it('should verify "agpl" as an invalid license key', () => {
      const hf = HyperFormula.buildEmpty({
        licenseKey: 'agpl-v1',
      })

      expect(hf.getConfig().licenseKeyValidityState).toEqual(LicenseKeyValidityState.INVALID)
    })

    it('should verify license keys correctnes', () => {
      const hf = HyperFormula.buildEmpty({
        licenseKey: '11111-11111-11111-11111-11111',
      })

      expect(hf.getConfig().licenseKeyValidityState).toEqual(LicenseKeyValidityState.INVALID)
    })
  })

  describe('missing key', () => {
    it('should verify an empty string as an invalid license key', () => {
      const hf = HyperFormula.buildEmpty({
        licenseKey: '',
      })

      expect(hf.getConfig().licenseKeyValidityState).toEqual(LicenseKeyValidityState.MISSING)
    })
  })
})
