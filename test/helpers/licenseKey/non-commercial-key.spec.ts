/**
 * The license key message is printed only once per window/process env.
 * Jest provides complete isolation between files only. That is why the test
 * contains only one case about "console.warn" message.
 */
import {HyperFormula} from '../../../src'

describe('license key', () => {
  it('should not warn a message about invalid key when "non-commercial-and-evaluation" is used', () => {
    spyOn(console, 'warn')

    HyperFormula.buildEmpty({
      licenseKey: 'non-commercial-and-evaluation',
    })

    expect(console.warn).not.toHaveBeenCalled()
  })
})
