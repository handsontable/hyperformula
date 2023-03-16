import {HyperFormula} from '../../src'
import {LicenseKeyValidityState} from '../../src/helpers/licenseKeyValidator'
import {adr, resetSpy} from '../testUtils'

describe('license key', () => {
  describe('valid key', () => {
    it('should verify "gpl-v3" as a valid license key', () => {
      const hf = HyperFormula.buildEmpty({
        licenseKey: 'gpl-v3',
      })

      expect(hf.licenseKeyValidityState).toEqual(LicenseKeyValidityState.VALID)
    })

    it('should verify "internal-use-in-handsontable" as a valid license key', () => {
      const hf = HyperFormula.buildEmpty({
        licenseKey: 'internal-use-in-handsontable',
      })

      expect(hf.licenseKeyValidityState).toEqual(LicenseKeyValidityState.VALID)
    })
  })

  describe('invalid key', () => {
    it('should verify "gpl" as an invalid license key', () => {
      const hf = HyperFormula.buildEmpty({
        licenseKey: 'gpl-v1',
      })

      expect(hf.licenseKeyValidityState).toEqual(LicenseKeyValidityState.INVALID)
    })

    it('should verify license keys correctness', () => {
      const hf = HyperFormula.buildEmpty({
        licenseKey: '11111-11111-11111-11111-11111',
      })

      expect(hf.licenseKeyValidityState).toEqual(LicenseKeyValidityState.INVALID)
    })
  })

  describe('missing key', () => {
    it('should verify an empty string as an invalid license key', () => {
      const hf = HyperFormula.buildEmpty({
        licenseKey: '',
      })

      expect(hf.licenseKeyValidityState).toEqual(LicenseKeyValidityState.MISSING)
    })
  })

  describe('expired key', () => {
    it('should verify that key is expired', () => {
      const hf = HyperFormula.buildEmpty({
        licenseKey: '80584-cc272-2e7c4-06f16-4db00',
      })

      expect(hf.licenseKeyValidityState).toEqual(LicenseKeyValidityState.EXPIRED)
    })
  })

  describe('checking validity of the license key', () => {
    beforeAll(() => {
      spyOn(console, 'warn')
    })

    beforeEach(() => {
      resetSpy(console.warn)
    })

    it('should be triggered when user calls getCellValue', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]], {
        licenseKey: 'invalid-key',
      })

      engine.getCellValue(adr('A1'))

      expect(console.warn).toHaveBeenCalled()
    })

    it('should not be triggered in the configuration stage of the engine', () => {
      const engine = HyperFormula.buildFromArray([[
        1, 2, '=A1+B1'
      ]], {
        licenseKey: 'invalid-key',
        maxRows: 10,
      })

      engine.addNamedExpression('ABC', '=Sheet1!$A$1')
      engine.updateConfig({ maxRows: 100 })
      engine.setCellContents(adr('A1'), 42)
      engine.setSheetContent(0, [[42]])
      engine.addSheet('test')
      engine.addRows(0, [0, 1])
      engine.addColumns(0, [0, 1])

      expect(console.warn).not.toHaveBeenCalled()
    })
  })
})