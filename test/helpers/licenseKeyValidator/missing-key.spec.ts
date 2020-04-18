/**
 * The license key message is printed only once per window/process env.
 * Jest provides complete isolation between files only. That is why the test
 * contains only one case about "console.warn" message.
 */
import sinon from 'sinon'
import {HyperFormula} from '../../../src'

describe('license key', () => {
  it('should warn a message about missing key', () => {
    const spy = sinon.spy(console, 'warn')

    HyperFormula.buildEmpty({
      licenseKey: '',
    })

    expect(spy.calledWithExactly('The license key for HyperFormula is missing.')).toBe(true)
  })
})
