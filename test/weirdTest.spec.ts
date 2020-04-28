import {HyperFormula} from '../src'

const sheet = [
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  ['','','','','','','','','','','','','','=N25'], //N31
  [],
  [],
  [],
  [],
  ['','','','','','','','','','','','','','=N31'], //N36
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  ['','','','','','','','','','','','','','=N25'], //N45
  [],
  ['','','','','','','','','','','','','','=N45'], //N47
  [],
  ['','','','','','','','','','','','','','=N36-N47'], //N49
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
