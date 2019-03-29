import {HandsOnEngine} from "../src";

describe('Matrix', () => {
  it('matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
        ['1','2'],
        ['3','4'],
        ['5','6'],
        ['1','2','3'],
        ['4','5','6'],
        ['=mmult(A1:B3,A4:C5)']
    ])

    console.log(engine)
  })
})
