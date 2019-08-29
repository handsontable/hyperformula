import {Config, HandsOnEngine} from '../src'
import {simpleCellAddress, SimpleCellAddress} from '../src/Cell'
import {EmptyCellVertex, FormulaCellVertex, MatrixVertex} from '../src/DependencyGraph'
import {CellReferenceAst} from '../src/parser/Ast'
import {CellAddress} from '../src/parser/CellAddress'
import {AbsoluteCellRange} from '../src/AbsoluteCellRange'
import './testConfig.ts'
import {extractReference, adr, extractMatrixRange, expectEngineToBeTheSameAs} from "./testUtils";

describe('Adding row - matrix check', () => {
  it('raise error if trying to add a row in a row with matrix', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['13'],
    ])

    expect(() => {
      engine.addRows(0, 3, 1)
    }).toThrow(new Error('It is not possible to add row in row with matrix'))

    expect(() => {
      engine.addRows(0, 2, 1)
    }).toThrow(new Error('It is not possible to add row in row with matrix'))
  })
})

describe('Adding row - reevaluation', () => {
  it('reevaluates cells', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=COUNTBLANK(A1:A2)'],
      // new row
      ['2'],
    ])

    expect(engine.getCellValue('B1')).toEqual(0)
    engine.addRows(0, 1, 1)
    expect(engine.getCellValue('B1')).toEqual(1)
  })

  it('dont reevaluate everything', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=COUNTBLANK(A1:A2)', '=SUM(A1:A1)'],
      // new row
      ['2'],
    ])
    const b1 = engine.addressMapping.getCell(adr('B1'))
    const c1 = engine.addressMapping.getCell(adr('C1'))
    const b1setCellValueSpy = jest.spyOn(b1 as any, 'setCellValue')
    const c1setCellValueSpy = jest.spyOn(c1 as any, 'setCellValue')

    engine.addRows(0, 1, 1)

    expect(b1setCellValueSpy).toHaveBeenCalled()
    expect(c1setCellValueSpy).not.toHaveBeenCalled()
  })

  it('reevaluates cells which are dependent on structure changes', () => {
    const engine = HandsOnEngine.buildFromArray([
      /* */
      ['1', '2', '=COLUMNS(A1:B1)'],
    ])
    const c1 = engine.addressMapping.getCell(adr('C1'))
    const c1setCellValueSpy = jest.spyOn(c1 as any, 'setCellValue')

    engine.addRows(0, 0, 1)

    expect(c1setCellValueSpy).toHaveBeenCalled()
  })
})

describe('Adding row - MatrixVertex', () => {
  it('MatrixVertex#formula should be updated', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
    ])

    engine.addRows(0, 1, 1)

    expect(extractMatrixRange(engine, adr('A4'))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B3')))
  })

  it('MatrixVertex#formula should be updated when different sheets', () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        ['1', '2'],
        ['3', '4']
      ],
      Sheet2: [
        ['{=TRANSPOSE($Sheet1.A1:B2)}', '{=TRANSPOSE($Sheet1.A1:B2)}'],
        ['{=TRANSPOSE($Sheet1.A1:B2)}', '{=TRANSPOSE($Sheet1.A1:B2)}'],
      ]
    })

    engine.addRows(0, 1, 1)

    expect(extractMatrixRange(engine, adr('A1', 1))).toEqual(new AbsoluteCellRange(adr('A1'), adr('B3')))
  })

  it('MatrixVertex#address should be updated', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
      ['{=TRANSPOSE(A1:B2)}', '{=TRANSPOSE(A1:B2)}'],
    ])

    engine.addRows(0, 1, 1)

    const matrixVertex = engine.addressMapping.fetchCell(adr('A4')) as MatrixVertex
    expect(matrixVertex.cellAddress).toEqual(adr('A4'))
  })
})

describe('Adding row - FormulaCellVertex#address update', () => {
  it('insert row, formula vertex address shifted', () => {
    const engine = HandsOnEngine.buildFromArray([
      // new row
      ['=SUM(1,2)'],
    ])

    let vertex = engine.addressMapping.fetchCell(adr('A1')) as FormulaCellVertex
    expect(vertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A1'))
    engine.addRows(0, 0, 1)
    vertex = engine.addressMapping.fetchCell(adr('A2')) as FormulaCellVertex
    expect(vertex.getAddress(engine.lazilyTransformingAstService)).toEqual(adr('A2'))
  })

  it("adding row in different sheet but same row as formula should not update formula address", () => {
    const engine = HandsOnEngine.buildFromSheets({
      Sheet1: [
        // new row
        ['1']
      ],
      Sheet2: [
        ['=$Sheet1.A1']
      ]
    })

    engine.addRows(0, 0, 1)

    const formulaVertex = engine.addressMapping.fetchCell(adr("A1", 1)) as FormulaCellVertex

    expect(formulaVertex.address).toEqual(simpleCellAddress(1, 0, 0))
    formulaVertex.getFormula(engine.lazilyTransformingAstService) // force transformations to be applied
    expect(formulaVertex.address).toEqual(simpleCellAddress(1, 0, 0))
  })
})

describe('Adding row - matrices adjustments', () => {
  it('add row inside numeric matrix, expand matrix', () => {
    const config = new Config({matrixDetection: true, matrixDetectionThreshold: 1})
    const engine = HandsOnEngine.buildFromArray([
      ['1', '2'],
      ['3', '4'],
    ], config)

    expect(engine.getCellValue('A2')).toEqual(3)

    engine.addRows(0, 1, 2)

    expect(engine.getCellValue('A2')).toEqual(0)
    expect(engine.getCellValue('A3')).toEqual(0)
    expect(engine.getCellValue('A4')).toEqual(3)
  })
})

describe('Adding row - address mapping', () => {
  it('verify sheet dimensions', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1'],
      // new col
      ['2']
    ])

    engine.addRows(0, 1, 1)

    expect(engine.getSheetDimensions(0)).toEqual({
      width: 1,
      height: 3,
    })
  })
})

describe('Adding row - fixing dependencies', () => {
  describe('all in same sheet (case 1)', () => {
    it('same sheet, case Aa, absolute row', () => {
      const engine = HandsOnEngine.buildFromArray([
        ['1'],
        // new row
        ['=A$1'],
      ])

      engine.addRows(0, 1, 1)

      expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.absoluteRow(0, 0, 0))
    })

    it('same sheet, case Aa, absolute row and col', () => {
      const engine = HandsOnEngine.buildFromArray([
        ['1'],
        // new row
        ['=$A$1'],
      ])

      engine.addRows(0, 1, 1)

      expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.absolute(0, 0, 0))
    })

    it('same sheet, case Ab', () => {
      const engine = HandsOnEngine.buildFromArray([
        ['=A$2'],
        // new row
        ['42'],
      ])

      engine.addRows(0, 1, 1)

      expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.absoluteRow(0, 0, 2))
    })

    it('same sheet, case Raa', () => {
      const engine = HandsOnEngine.buildFromArray([
        ['=A2'],
        ['13'],
        // new row
        ['42'],
      ])

      engine.addRows(0, 2, 1)

      expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 0, 1))
    })

    it('same sheet, case Rab', () => {
      const engine = HandsOnEngine.buildFromArray([
        ['42'],
        ['13'],
        // new row
        ['=A2'],
      ])

      engine.addRows(0, 2, 1)

      expect(extractReference(engine, adr('A4'))).toEqual(CellAddress.relative(0, 0, -2))
    })

    it('same sheet, case Rba', () => {
      const engine = HandsOnEngine.buildFromArray([
        ['=A3'],
        ['13'],
        // new row
        ['42'],
      ])

      engine.addRows(0, 2, 1)

      expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 0, 3))
    })

    it('same sheet, case Rbb', () => {
      const engine = HandsOnEngine.buildFromArray([
        ['42'],
        // new row
        ['=A3'],
        ['13'],
      ])

      engine.addRows(0, 1, 1)

      expect(extractReference(engine, adr('A3'))).toEqual(CellAddress.relative(0, 0, 1))
    })

    it('same sheet, same row', () => {
      const engine = HandsOnEngine.buildFromArray([
        ['42'],
        ['43', '=A2'],
      ])

      engine.addRows(0, 1, 1)

      expect(extractReference(engine, adr('B3'))).toEqual(CellAddress.relative(0, -1, 0))
    })
  })

  describe('dependency address sheet different than formula address sheet and sheet in which we add rows (case 2)', () => {
    it("absolute case", () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          // new row
          ['=$Sheet2.A$1'],
        ],
        Sheet2: [
          ['1'],
        ]
      })

      engine.addRows(0, 0, 1)

      expect(extractReference(engine, adr("A2"))).toEqual(CellAddress.absoluteRow(1, 0, 0))
    })

    it("n < R < r", () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          [''],
          // new row
          [''],
          ['=$Sheet2.A1'],
        ],
        Sheet2: [
          ['1'],
        ]
      })

      engine.addRows(0, 1, 1)

      expect(extractReference(engine, adr("A4"))).toEqual(CellAddress.relative(1, 0, -3))
    })

    it("n < R = r", () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          [''],
          // new row
          ['=$Sheet2.A1'],
        ],
        Sheet2: [
          ['1'],
        ]
      })

      engine.addRows(0, 1, 1)

      expect(extractReference(engine, adr("A3"))).toEqual(CellAddress.relative(1, 0, -2))
    })

    it("n = R < r", () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          // new row
          [''],
          ['=$Sheet2.A1'],
        ],
        Sheet2: [
          ['1'],
        ]
      })

      engine.addRows(0, 0, 1)

      expect(extractReference(engine, adr("A3"))).toEqual(CellAddress.relative(1, 0, -2))
    })

    it("n = R = r", () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          // new row
          ['=$Sheet2.A1'],
        ],
        Sheet2: [
          ['1'],
        ]
      })

      engine.addRows(0, 0, 1)

      expect(extractReference(engine, adr("A2"))).toEqual(CellAddress.relative(1, 0, -1))
    })


    it("R < n < r", () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          // new row
          [''],
          [''],
          ['=$Sheet2.A2'],
        ],
        Sheet2: [
          [''],
          ['1'],
        ]
      })

      engine.addRows(0, 0, 1)

      expect(extractReference(engine, adr("A4"))).toEqual(CellAddress.relative(1, 0, -2))
    })

    it("R < n = r", () => { // also R 
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          // new row
          [''],
          ['=$Sheet2.A2'],
        ],
        Sheet2: [
          [''],
          ['1'],
        ]
      })

      engine.addRows(0, 0, 1)

      expect(extractReference(engine, adr("A3"))).toEqual(CellAddress.relative(1, 0, -1))
    })

    // "R = n < r" already above as "n = R < r"
    
    // "R = n = r" already above


    it("R < r < n", () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          // new row
          [''],
          ['=$Sheet2.A3'],
        ],
        Sheet2: [
          [''],
          [''],
          ['1'],
        ]
      })

      engine.addRows(0, 0, 1)

      expect(extractReference(engine, adr("A3"))).toEqual(CellAddress.relative(1, 0, 0))
    })

    // "R < r = n" already above as "R < n = r"

    it("R = r < n", () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          // new row
          ['=$Sheet2.A2'],
        ],
        Sheet2: [
          [''],
          ['1'],
        ]
      })

      engine.addRows(0, 0, 1)

      expect(extractReference(engine, adr("A2"))).toEqual(CellAddress.relative(1, 0, 0))
    })

    // "R = n = r" already above


    // Actually "r ? R ? n", "r ? n ? R", "n ? r ? R" could be written
    it("r < R", () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          ['=$Sheet2.A1'],
          // new row
        ],
        Sheet2: [
          ['1'],
        ]
      })

      engine.addRows(0, 1, 1)

      expect(extractReference(engine, adr("A1"))).toEqual(CellAddress.relative(1, 0, 0))
    })
  })

  describe('formula address sheet different than dependency address sheet and sheet in which we add rows (case 3)', () => {
    it("dependency address before added row", () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          // new row
          ['1'],
          ['2'],
        ],
        Sheet2: [
          ['=$Sheet1.A2']
        ]
      })

      engine.addRows(0, 0, 1)

      expect(extractReference(engine, adr("A1", 1))).toEqual(CellAddress.relative(0, 0, 2))
    })

    it("dependency address at added row", () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          // new row
          ['1']
        ],
        Sheet2: [
          ['=$Sheet1.A1']
        ]
      })

      engine.addRows(0, 0, 1)

      expect(extractReference(engine, adr("A1", 1))).toEqual(CellAddress.relative(0, 0, 1))
    })

    it("dependency address after added row", () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          ['1'],
          // new row
        ],
        Sheet2: [
          ['=$Sheet1.A1']
        ]
      })

      engine.addRows(0, 1, 1)

      expect(extractReference(engine, adr("A1", 1))).toEqual(CellAddress.relative(0, 0, 0))
    })
  })

  describe('sheet where we add rows different than dependency address and formula address (case 4)', () => {
    it('works', () => {
      const engine = HandsOnEngine.buildFromSheets({
        Sheet1: [
          ['=A2'],
          ['13'],
        ],
        Sheet2: [
          [''],
          // new row
          ['78'],
        ],
      })

      engine.addRows(1, 1, 1)

      expect(extractReference(engine, adr('A1'))).toEqual(CellAddress.relative(0, 0, 1))
    })
  })
})

describe('Adding row, ranges', () => {
  it('insert row in middle of range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=SUM(A1:A3)'],
      // new row
      ['2', ''],
      ['3', ''],
    ])

    expect(engine.rangeMapping.getRange(adr('A1'), adr('A3'))).not.toBe(null)
    engine.addRows(0, 1, 1)
    expect(engine.rangeMapping.getRange(adr('A1'), adr('A3'))).toBe(null)
    expect(engine.rangeMapping.getRange(adr('A1'), adr('A4'))).not.toBe(null)
  })

  it('insert row above range', () => {
    const engine = HandsOnEngine.buildFromArray([
      // new row
      ['1', '=SUM(A1:A3)'],
      ['2', ''],
      ['3', ''],
    ])

    expect(engine.rangeMapping.getRange(adr('A1'), adr('A3'))).not.toBe(null)
    engine.addRows(0, 0, 1)
    expect(engine.rangeMapping.getRange(adr('A1'), adr('A3'))).toBe(null)
    expect(engine.rangeMapping.getRange(adr('A2'), adr('A4'))).not.toBe(null)
  })

  it('insert row below range', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=SUM(A1:A3)'],
      ['2', ''],
      ['3', ''],
      // new row
    ])

    expect(engine.rangeMapping.getRange(adr('A1'), adr('A3'))).not.toBe(null)
    engine.addRows(0, 3, 1)
    expect(engine.rangeMapping.getRange(adr('A1'), adr('A3'))).not.toBe(null)
  })

  it('it should insert new cell with edge to only one range below', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', '=SUM(A1:A1)'],
      ['2', '=SUM(A1:A2)'],
      //
      ['3', '=SUM(A1:A3)'],
      ['4', '=SUM(A1:A4)'],
    ])

    engine.addRows(0, 2, 1)

    const a3 = engine.addressMapping.fetchCell(adr('A3'))
    const a1a4 = engine.rangeMapping.fetchRange(adr('A1'), adr('A4')) // A1:A4

    expect(engine.graph.existsEdge(a3, a1a4)).toBe(true)
    expect(engine.graph.adjacentNodesCount(a3)).toBe(1)
  })

  it('it should insert new cell with edge to only one range below, shifted by 1', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', ''],
      ['2', '=SUM(A1:A1)'],
      ['3', '=SUM(A1:A2)'],
      //
      ['4', '=SUM(A1:A3)'],
    ])

    engine.addRows(0, 3, 1)

    const a4 = engine.addressMapping.getCell(adr('A4'))
    expect(a4).toBe(null)
  })

  it('range start in row', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', ''],
      //
      ['2', '=SUM(A2:A4)'],
      ['3', ''],
      ['4', ''],
    ])

    engine.addRows(0, 1, 1)

    const a2 = engine.addressMapping.getCell(adr('A2'))
    expect(a2).toBe(null)
  })

  it('range start above row', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', ''],
      //
      ['2', '=SUM(A1:A4)'],
      ['3', ''],
      ['4', ''],
    ])

    engine.addRows(0, 1, 1)

    const a2 = engine.addressMapping.fetchCell(adr('A2'))
    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A5'))
    expect(a2).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a2, range)).toBe(true)
  })

  it('range start below row', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', ''],
      //
      ['2', '=SUM(A3:A4)'],
      ['3', ''],
      ['4', ''],
    ])

    engine.addRows(0, 1, 1)

    const a2 = engine.addressMapping.getCell(adr('A2'))
    expect(a2).toBe(null)
  })

  it('range end above row', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', ''],
      //
      ['2', '=SUM(A1:A1)'],
      ['3', ''],
      ['4', ''],
    ])

    engine.addRows(0, 1, 1)

    const a2 = engine.addressMapping.getCell(adr('A2'))
    expect(a2).toBe(null)
  })

  it('range end in a row', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', ''],
      //
      ['2', '=SUM(A1:A2)'],
      ['3', ''],
      ['4', ''],
    ])

    engine.addRows(0, 1, 1)

    const a2 = engine.addressMapping.fetchCell(adr('A2'))

    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A3'))
    expect(a2).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a2, range)).toBe(true)
  })

  it('range end below row', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', ''],
      //
      ['2', '=SUM(A1:A3)'],
      ['3', ''],
      ['4', ''],
    ])

    engine.addRows(0, 1, 1)

    const a2 = engine.addressMapping.fetchCell(adr('A2'))

    const range = engine.rangeMapping.fetchRange(adr('A1'), adr('A4'))
    expect(a2).toBeInstanceOf(EmptyCellVertex)
    expect(engine.graph.existsEdge(a2, range)).toBe(true)
  })

  it('range start and end in a row', () => {
    const engine = HandsOnEngine.buildFromArray([
      ['1', ''],
      //
      ['2', '=SUM(A2:A2)'],
      ['3', ''],
      ['4', ''],
    ])

    engine.addRows(0, 1, 1)

    const a2 = engine.addressMapping.getCell(adr('A2'))
    expect(a2).toBe(null)
  })
})
