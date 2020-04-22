/**
 * The license key message is printed only once per window/process env.
 * Jest provides complete isolation between files only. That is why the test
 * contains only one case about "console.warn" message.
 */
import {HyperFormula} from '../../../src'

describe('license key', () => {
  it('should not warn a message about invalid key when "internal-use-in-handsontable" is used', () => {
    spyOn(console, 'warn')

    HyperFormula.buildEmpty({
      licenseKey: 'internal-use-in-handsontable',
    })

    expect(console.warn).not.toHaveBeenCalled()
  })
})
