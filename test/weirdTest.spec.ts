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
  ['','','','','','','','','','','','','','=+N78'],
  [],
  [],
  [],
  [],
  ['','','','','','','','','','','','','','=+N35+N33+N32+N31'],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  ['','','','','','','','','','','','','','=N101'],
  [],
  ['','','','','','','','','','','','','','=+N46+N45'],
  [],
  ['','','','','','','','','','','','','','=+N36-N43-N47'],
  [],
  [],
  [],
  [],
  [],
  ['','','','','','','','','','','','','','=+N25'],
  ['','','','','','','','','','','','','',''],
  [],
  [],
  ['','','','','','','','','','','','','',''],
  ['','','','','','','','','','','','','',''],
  ['','','','','','','','','','','','','',''],
  ['','','','','','','','','','','','','','=+N55+N56+N59+N60+N61'],
  [],
  [],
  [],
  ['','','','','','','','','','','','','',''],
  [],
  [],
  [],
  [],
  [],
  [],
  [],
  ['','','','','','','','','','','','','',''],
  [],
  ['','','','','','','','','','','','','',''],
  ['','','','','','','','','','','','','','=+N74+N66+N62'],
  ['','','','','','','','','','','','','','=+N76+N77'],
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
  ['','','','','','','','','','','','','',''],
  ['','','','','','','','','','','','','','=N25'],
  ['','','','','','','','','','','','','',''],
  ['','','','','','','','','','','','','','=+N98+N99-N100'],
]





function works(arr: any): boolean {
  try {
    HyperFormula.buildFromArray(arr)
    return true
  } catch (e) {
    return false
  }
}


it('minimize ',() => {
  for(let i=0;i<sheet.length;i++) {
    let x = sheet[i]
    sheet[i] = []
    if(works(sheet)) {
      sheet[i] = x
    }
  }
  for(let i=0;i<sheet.length;i++) {
    console.log(sheet[i],',')
  }
  const engine = HyperFormula.buildFromArray(sheet)
})

it( 'fails',() => {
  const engine = HyperFormula.buildFromArray(sheet)
})
