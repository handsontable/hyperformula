/**
 * The license key message is printed only once per window/process env.
 * Jest provides complete isolation between files only. That is why the test
 * contains only one case about "console.warn" message.
 */
import sinon from 'sinon'
import {HyperFormula} from '../../../src'

describe('license key', () => {
  it('should warn a message about invalid key when wrong "agpl" license version is used', () => {
    // const stub = sinon.stub(console, 'warn')
    const stub = sinon.fake()

    HyperFormula.buildEmpty({
      licenseKey: 'agpl-v1',
    })

    expect(stub.calledOnce).toBe(true)
    expect(stub.calledWith('The license key for HyperFormula is invalid.')).toBe(true)
    // stub.restore()
  })
})
