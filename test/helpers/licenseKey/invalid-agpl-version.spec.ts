/**
 * The license key message is printed only once per window/process env.
 * Jest provides complete isolation between files only. That is why the test
 * contains only one case about "console.warn" message.
 */
import {HyperFormula} from '../../../src'

describe('license key', () => {
  it('should warn message about invalid key', async () => {
    spyOn(console, 'warn')

    HyperFormula.buildEmpty({
      licenseKey: 'agpl-v1',
    })

    expect(console.warn).toHaveBeenCalledWith('The license key for HyperFormula is invalid.');
  })
})
