import {toEqualError} from './toEqualError'

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  spyOn = jest.spyOn
  expect.extend(toEqualError)
})
