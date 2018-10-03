import {HandsOnEngine} from "../src";

describe('BenchmarkA', () => {
  const rows = 10000
  const millisecondsPerThousandRows = 1500

  it('', () => {
    const hoe = new HandsOnEngine()

    let sheet = []
    sheet.push(['100', '200', '300', '400', '500'])

    let prev = 1
    while (prev < rows) {
      sheet.push([
        `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + A${prev}`, // always 100
        `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + B${prev}`, // always 200
        `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + C${prev}`, // always 300
        `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + D${prev}`, // always 400
        `=D${prev}*E${prev} - D${prev}*(B${prev} + C${prev}) + C${prev}*(D${prev} - A${prev}) - C${prev} * C${prev} + E${prev}`, // always 500
      ])

      prev++
    }


    const timestampBefore = Date.now()
    hoe.loadSheet(sheet)
    const timestampAfter = Date.now()

    expect(hoe.getCellValue("A10000")).toBe('100')
    expect(hoe.getCellValue("B10000")).toBe('200')
    expect(hoe.getCellValue("C10000")).toBe('300')
    expect(hoe.getCellValue("D10000")).toBe('400')
    expect(hoe.getCellValue("E10000")).toBe('500')

    // console.warn(`Benchmark A took ${(timestampAfter - timestampBefore) / 1000} seconds`)
    expect((timestampAfter - timestampBefore) / (rows / 1000)).toBeLessThan(millisecondsPerThousandRows)
  });
});
