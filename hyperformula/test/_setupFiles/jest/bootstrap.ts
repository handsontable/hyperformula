import {toEqualError} from './toEqualError'

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line no-global-assign
  spyOn = jest.spyOn
  expect.extend(toEqualError)
})
