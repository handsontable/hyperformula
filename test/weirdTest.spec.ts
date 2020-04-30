import {HyperFormula} from '../src'

const sheet = [
  ['=B1'], //A1
  [],
  [],
  [],
  [],
  ['=A1'], //A6
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  ['=B1'], //A15
  [],
  ['=A15'], //A17
  [],
  ['=A6-A17'], //A19
]





function works(arr: any): boolean {
  try {
    HyperFormula.buildFromArray(arr)
    return true
  } catch (e) {
    return false
  }
}


describe( 'abcd', () => {
  // it('minimize ', () => {
  //   for (let i = 0; i < sheet.length; i++) {
  //     let x = sheet[i]
  //     sheet[i] = []
  //     if (works(sheet)) {
  //       sheet[i] = x
  //     }
  //   }
  //   for (let i = 0; i < sheet.length; i++) {
  //     console.log(sheet[i], ',')
  //   }
  //   const engine = HyperFormula.buildFromArray(sheet)
  // })

  it('fails', () => {
    const engine = HyperFormula.buildFromArray(sheet)
  })
})
