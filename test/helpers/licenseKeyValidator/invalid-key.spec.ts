/**
 * The license key message is printed only once per window/process env.
 * Jest provides complete isolation between files only. That is why the test
 * contains only one case about "console.warn" message.
 */
import {HyperFormula} from '../../../src'

describe('license key', () => {
  xit('should warn a message about invalid key', () => {
    const spy = spyOn(console, 'warn')

    HyperFormula.buildEmpty({
      licenseKey: '11111-11111-11111-11111-11111',
    })

    expect(spy).toHaveBeenCalledWith('The license key for HyperFormula is invalid.')
  })
})
