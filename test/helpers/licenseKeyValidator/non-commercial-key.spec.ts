/**
 * The license key message is printed only once per window/process env.
 * Jest provides complete isolation between files only. That is why the test
 * contains only one case about "console.warn" message.
 */
import sinon from 'sinon'
import {HyperFormula} from '../../../src'

describe('license key', () => {
  it('should not warn a message about invalid key when "non-commercial-and-evaluation" is used', () => {
    const spy = sinon.spy(console, 'warn')

    HyperFormula.buildEmpty({
      licenseKey: 'non-commercial-and-evaluation',
    })

    expect(spy.notCalled).toBe(true)
  })
})
