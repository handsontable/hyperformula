import {UnsupportedFileError} from '../../src/errors'

describe('UnsupportedFileError', () => {
  it('is an instance of Error and UnsupportedFileError', () => {
    const error = new UnsupportedFileError('empty')

    expect(error instanceof Error).toBe(true)
    expect(error instanceof UnsupportedFileError).toBe(true)
  })

  it('exposes the reason it was constructed with', () => {
    expect(new UnsupportedFileError('empty').reason).toBe('empty')
    expect(new UnsupportedFileError('unparseable').reason).toBe('unparseable')
  })

  it('includes the reason in the message', () => {
    const error = new UnsupportedFileError('empty')

    expect(error.message).toContain('empty')
  })

  it('includes the detail in the message when provided', () => {
    const error = new UnsupportedFileError('unparseable', 'unexpected end of file')

    expect(error.message).toContain('unparseable')
    expect(error.message).toContain('unexpected end of file')
  })
})
