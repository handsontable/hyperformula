/**
 * The license key message is printed only once per window/process env.
 * Jest provides complete isolation between files only. That is why the test
 * contains only one case about "console.warn" message.
 */
import {HyperFormula} from '../../../src'

describe('license key', () => {
  it('should warn message about invalid key', () => {
    spyOn(console, 'warn')

    HyperFormula.buildEmpty({
      licenseKey: 'non-commercial-and-evaluation',
    })

    expect(console.warn).not.toHaveBeenCalled()
  })
})
