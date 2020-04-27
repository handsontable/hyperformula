import {HyperFormula } from '../src'
import { AbsoluteCellRange } from '../src/AbsoluteCellRange'


describe('Test suite for examples', () => {
  it('sheetAdded works', function() {
    const hfInstance = HyperFormula.buildFromSheets({
      MySheet1: [
       ['1'],
       ['2'],
      ],
      MySheet2: [
       ['10'],
       ['20'],
      ],
      })

      hfInstance.setCellContents({ col: 3, row: 0, sheet: 1 }, [['=B1']])
     
     // should return the change: [['10'], ['20']]
     const changes = hfInstance.clearSheet('MySheet2')

     console.log(changes)
    
  })
})