import {Config} from '../../src/Config'
import {dateNumberToString} from './testUtils'

describe('test utils', () => {
  it('#dateNumberToString should return properly formatted  date', () => {
    expect(dateNumberToString(0, new Config())).toBe('30/12/1899')
    expect(dateNumberToString(2, new Config())).toBe('01/01/1900')
    expect(dateNumberToString(43465, new Config())).toBe('31/12/2018')
  })
})
