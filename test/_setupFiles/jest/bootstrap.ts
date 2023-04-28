import {toEqualError} from './toEqualError'


beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  spyOn = jest.spyOn
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  expect.extend(toEqualError)
})
