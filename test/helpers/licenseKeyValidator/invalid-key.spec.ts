/**
 * The license key message is printed only once per window/process env.
 * Jest provides complete isolation between files only. That is why the test
 * contains only one case about "console.warn" message.
 */
import sinon from 'sinon'
import {HyperFormula} from '../../../src'

describe('license key', () => {
  it('should warn a message about invalid key', () => {
    const spy = sinon.spy(console, 'warn')

    HyperFormula.buildEmpty({
      licenseKey: '11111-11111-11111-11111-11111',
    })

    expect(spy.calledWithExactly('The license key for HyperFormula is invalid.')).toBe(true)
  })
})
