import moment from 'moment'
import {Config} from '../src/Config'
import {DateTimeHelper, SimpleDate} from '../src/DateTimeHelper'
import {DateNumber, DateTimeNumber, getRawValue, TimeNumber} from '../src/interpreter/InterpreterValue'
import {Maybe} from '../src/Maybe'

describe('Date helpers', () => {
  it('#dateToNumber should return number representation of a date', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateToNumber({year: 1900, month: 1, day: 1})).toBe(2)
    expect(dateHelper.dateToNumber({year: 1899, month: 12, day: 30})).toBe(0)
    expect(dateHelper.dateToNumber({year: 1900, month: 12, day: 31})).toBe(366)
    expect(dateHelper.dateToNumber({year: 2018, month: 12, day: 31})).toBe(43465)
  })

  it('#dateToNumber should return number representation of a date, excel compatibility', () => {
    const dateHelper = new DateTimeHelper(new Config({leapYear1900: true}))
    expect(dateHelper.dateToNumber({year: 1900, month: 1, day: 1})).toBe(2)
    expect(dateHelper.dateToNumber({year: 1899, month: 12, day: 30})).toBe(0)
    expect(dateHelper.dateToNumber({year: 1900, month: 12, day: 31})).toBe(367)
    expect(dateHelper.dateToNumber({year: 2018, month: 12, day: 31})).toBe(43466)
  })

  it('#dateNumberToMonthNumber should return proper month number', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.numberToSimpleDate(0).month).toEqual(12)
    expect(dateHelper.numberToSimpleDate(2).month).toEqual(1)
    expect(dateHelper.numberToSimpleDate(43465).month).toEqual(12)
  })

  it('#stringToDateNumber - tests expected to return not null, dates', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('16/08/1985')).toEqual(new DateNumber(31275, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('15/01/2020')).toEqual(new DateNumber(43845, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('29/02/2000')).toEqual(new DateNumber(36585, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('31/12/2999')).toEqual(new DateNumber(401768, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('31 12 2999')).toEqual(new DateNumber(401768, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber(' 31 12 2999 ')).toEqual(new DateNumber(401768, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('31  12 2999')).toEqual(new DateNumber(401768, 'DD/MM/YYYY'))
  })

  it('#stringToDateNumber - no time format', () => {
    const dateHelper = new DateTimeHelper(new Config({timeFormats: []}))
    expect(dateHelper.dateStringToDateNumber('16/08/1985')).toEqual(new DateNumber(31275, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('15/01/2020')).toEqual(new DateNumber(43845, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('29/02/2000')).toEqual(new DateNumber(36585, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('31/12/2999')).toEqual(new DateNumber(401768, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('31 12 2999')).toEqual(new DateNumber(401768, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber(' 31 12 2999 ')).toEqual(new DateNumber(401768, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('31  12 2999')).toEqual(new DateNumber(401768, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('16/08/1985 3:40')).toEqual(undefined)
  })

  it('#stringToDateNumber - tests expected to return not null, times', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('00:00')).toEqual(new TimeNumber(0, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('03:00')).toEqual(new TimeNumber(0.125, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('24:00')).toEqual(new TimeNumber(1, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('48:00')).toEqual(new TimeNumber(2, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('00:01')).toEqual(new TimeNumber(0.0006944444444444445, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('00:00:00')).toEqual(new TimeNumber(0, 'hh:mm:ss.sss'))
    expect(dateHelper.dateStringToDateNumber('00:00:00.001')).toEqual(new TimeNumber(1.1574074074074076e-8, 'hh:mm:ss.sss'))
    expect(dateHelper.dateStringToDateNumber('00:00:00.0001')).toEqual(new TimeNumber(0, 'hh:mm:ss.sss'))
    expect(dateHelper.dateStringToDateNumber('00:00:01')).toEqual(new TimeNumber(0.000011574074074074073, 'hh:mm:ss.sss'))
    expect(dateHelper.dateStringToDateNumber('00:179:60')).toEqual(new TimeNumber(0.125, 'hh:mm:ss.sss'))
  })

  it('#stringToDateNumber - no date format', () => {
    const dateHelper = new DateTimeHelper(new Config({dateFormats: []}))
    expect(dateHelper.dateStringToDateNumber('00:00')).toEqual(new TimeNumber(0, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('03:00')).toEqual(new TimeNumber(0.125, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('24:00')).toEqual(new TimeNumber(1, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('48:00')).toEqual(new TimeNumber(2, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('00:01')).toEqual(new TimeNumber(0.0006944444444444445, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('00:00:00')).toEqual(new TimeNumber(0, 'hh:mm:ss.sss'))
    expect(dateHelper.dateStringToDateNumber('00:00:00.001')).toEqual(new TimeNumber(1.1574074074074076e-8, 'hh:mm:ss.sss'))
    expect(dateHelper.dateStringToDateNumber('00:00:00.0001')).toEqual(new TimeNumber(0, 'hh:mm:ss.sss'))
    expect(dateHelper.dateStringToDateNumber('00:00:01')).toEqual(new TimeNumber(0.000011574074074074073, 'hh:mm:ss.sss'))
    expect(dateHelper.dateStringToDateNumber('00:179:60')).toEqual(new TimeNumber(0.125, 'hh:mm:ss.sss'))
    expect(dateHelper.dateStringToDateNumber('16/08/1985 3:40')).toEqual(undefined)
  })

  it('#stringToDateNumber - fraction of seconds', () => {
    const dateHelper = new DateTimeHelper(new Config({timeFormats: ['hh:mm:ss.ss']}))
    expect(getRawValue(dateHelper.dateStringToDateNumber('00:00:00.1'))).toBeCloseTo(0.0000011574074074074074)
    expect(getRawValue(dateHelper.dateStringToDateNumber('00:00:00.01'))).toBeCloseTo(1.1574074074074073e-7)
    expect(getRawValue(dateHelper.dateStringToDateNumber('00:00:00.001'))).toBeCloseTo(0)
  })

  it('#stringToDateNumber am/pm', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('03:00 am')).toEqual(new TimeNumber(0.125, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('03:00 a')).toEqual(new TimeNumber(0.125, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('03:00 pm')).toEqual(new TimeNumber(0.625, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('12:00 pm')).toEqual(new TimeNumber(0.5, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('12:00 p')).toEqual(new TimeNumber(0.5, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('00:00 pm')).toEqual(new TimeNumber(0.5, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('12:59 pm')).toEqual(new TimeNumber(0.5409722222222222, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('12:00 am')).toEqual(new TimeNumber(0.0, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('00:00 am')).toEqual(new TimeNumber(0.0, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('12:59 am')).toEqual(new TimeNumber(0.04097222222222222, 'hh:mm'))
    expect(dateHelper.dateStringToDateNumber('13:00 am')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('13:00 pm')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('pm')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('02/02/2020 pm')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('02/02/2020 12:00pm')).toEqual(new DateTimeNumber(43863.5, 'DD/MM/YYYY hh:mm'))
    expect(dateHelper.dateStringToDateNumber('02/02/2020 12:9999pm')).toEqual(new DateTimeNumber(43870.44375, 'DD/MM/YYYY hh:mm'))
  })

  it('#stringToDateNumber - tests expected to return not null, dates + times', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('16/08/1985 03:40')).toEqual(new DateTimeNumber(31275.152777777777, 'DD/MM/YYYY hh:mm'))
    expect(dateHelper.dateStringToDateNumber(' 31 12 2999 00:00:00 ')).toEqual(new DateTimeNumber(401768, 'DD/MM/YYYY hh:mm:ss.sss'))
  })

  it('#stringToDateNumber - excel compatibility', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('29/02/1900')).toBe(undefined)
    const dateHelper2 = new DateTimeHelper(new Config({leapYear1900: true}))
    expect(dateHelper2.dateStringToDateNumber('29/02/1900')).toEqual(new DateNumber(61, 'DD/MM/YYYY'))
  })

  it('stringToDateNumber - 00 year parsing', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('16/08/85')).toEqual(new DateNumber(31275, 'DD/MM/YY'))
    expect(dateHelper.dateStringToDateNumber('15/01/20')).toEqual(new DateNumber(43845, 'DD/MM/YY'))
    expect(dateHelper.dateStringToDateNumber('29/02/00')).toEqual(new DateNumber(36585, 'DD/MM/YY'))
    expect(dateHelper.dateStringToDateNumber('31/12/99')).toEqual(new DateNumber(36525, 'DD/MM/YY'))
    const dateHelper1 = new DateTimeHelper(new Config({nullYear: 0}))
    expect(dateHelper1.dateStringToDateNumber('15/01/20')).toEqual(new DateNumber(7320, 'DD/MM/YY'))
    const dateHelper2 = new DateTimeHelper(new Config({nullYear: 100}))
    expect(dateHelper2.dateStringToDateNumber('31/12/99')).toEqual(new DateNumber(73050, 'DD/MM/YY'))
  })

  it('stringToDateNumber - other date formats', () => {
    const dateHelper = new DateTimeHelper(new Config({dateFormats: ['MM/DD/YYYY']}))
    expect(dateHelper.dateStringToDateNumber('12/31/99')).toBe(undefined)
    const dateHelper1 = new DateTimeHelper(new Config({dateFormats: ['YY/MM/DD']}))
    expect(dateHelper1.dateStringToDateNumber('99/12/31')).toEqual(new DateNumber(36525, 'YY/MM/DD'))
    const dateHelper2 = new DateTimeHelper(new Config({dateFormats: ['MM/DD/YY', 'YY/MM/DD']}))
    expect(dateHelper2.dateStringToDateNumber('99/12/31')).toEqual(new DateNumber(36525, 'YY/MM/DD'))
    const dateHelper3 = new DateTimeHelper(new Config({dateFormats: ['YYYY/DD/MM']}))
    expect(dateHelper3.dateStringToDateNumber('1999/12/31')).toBe(undefined)
    const dateHelper4 = new DateTimeHelper(new Config({dateFormats: ['YYYY/MM/DD']}))
    expect(dateHelper4.dateStringToDateNumber('1999/12/31')).toEqual(new DateNumber(36525, 'YYYY/MM/DD'))
    const dateHelper5 = new DateTimeHelper(new Config({dateFormats: ['MM/YYYY/DD']}))
    expect(dateHelper5.dateStringToDateNumber('12/1999/31')).toEqual(new DateNumber(36525, 'MM/YYYY/DD'))
    const dateHelper6 = new DateTimeHelper(new Config({dateFormats: ['DD/YYYY/MM']}))
    expect(dateHelper6.dateStringToDateNumber('31/1999/12')).toEqual(new DateNumber(36525, 'DD/YYYY/MM'))
    const dateHelper7 = new DateTimeHelper(new Config({dateFormats: ['DD/MM/YYYY']}))
    expect(dateHelper7.dateStringToDateNumber('31/12/1999')).toEqual(new DateNumber(36525, 'DD/MM/YYYY'))
    const dateHelper8 = new DateTimeHelper(new Config({dateFormats: ['YY/DD/MM']}))
    expect(dateHelper8.dateStringToDateNumber('99/31/12')).toEqual(new DateNumber(36525, 'YY/DD/MM'))
    const dateHelper9 = new DateTimeHelper(new Config({dateFormats: ['MM/YY/DD']}))
    expect(dateHelper9.dateStringToDateNumber('12/99/31')).toEqual(new DateNumber(36525, 'MM/YY/DD'))
    const dateHelper10 = new DateTimeHelper(new Config({dateFormats: ['DD/MM/YY']}))
    expect(dateHelper10.dateStringToDateNumber('31/12/99')).toEqual(new DateNumber(36525, 'DD/MM/YY'))
    const dateHelper11 = new DateTimeHelper(new Config({dateFormats: ['DD/YY/MM']}))
    expect(dateHelper11.dateStringToDateNumber('31/99/12')).toEqual(new DateNumber(36525, 'DD/YY/MM'))
  })

  it('stringToDateNumber - other time formats', () => {
    const dateHelper = new DateTimeHelper(new Config({timeFormats: ['mm:hh']}))
    expect(dateHelper.dateStringToDateNumber('60:02')).toEqual(new TimeNumber(0.125, 'mm:hh'))
  })

  it('#stringToDateNumber - tests expected to return undefined', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('1/1/10000')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('5/29/1453')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('www')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('0')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('0/0/1999')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('13/13/2020')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('w8')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('www1')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('10/2020')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('12//31/2999')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('12/31/2999 0')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('12//31/2999 0:0')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('12/31/2999 0:0:0:0')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('12:00 12/31/2999')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber(' ')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('')).toBe(undefined)
  })
})

describe('Date helpers, other zero date', () => {
  it('#dateToNumber should return number representation of a date, different zero date', () => {
    const dateHelper = new DateTimeHelper(new Config({nullDate: {year: 1950, month: 6, day: 15}}))
    expect(dateHelper.dateToNumber({year: 1900, month: 1, day: 1})).toBe(-18427)
    expect(dateHelper.dateToNumber({year: 1899, month: 12, day: 30})).toBe(-18429)
    expect(dateHelper.dateToNumber({year: 1900, month: 12, day: 31})).toBe(-18063)
    expect(dateHelper.dateToNumber({year: 2018, month: 12, day: 31})).toBe(25036)
  })

  it('#dateNumberToMonthNumber should return proper month number, different zero date', () => {
    const config = new Config({nullDate: {year: 1950, month: 6, day: 15}})
    const dateHelper = new DateTimeHelper(config)
    expect(dateHelper.numberToSimpleDate(0).month).toEqual(6)
    expect(dateHelper.numberToSimpleDate(2).month).toEqual(6)
    expect(dateHelper.numberToSimpleDate(43465).month).toEqual(6)
  })

  it('#stringToDateNumber - tests expected to return not null, different zero date', () => {
    const dateHelper = new DateTimeHelper(new Config({nullDate: {year: 1950, month: 6, day: 15}}))
    expect(dateHelper.dateStringToDateNumber('16/08/1985')).toEqual(new DateNumber(12846, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('15/01/2020')).toEqual(new DateNumber(25416, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('29/02/2000')).toEqual(new DateNumber(18156, 'DD/MM/YYYY'))
    expect(dateHelper.dateStringToDateNumber('31/12/2999')).toEqual(new DateNumber(383339, 'DD/MM/YYYY'))
  })
})

describe('Custom date parsing', () => {
  function customParseDate(dateString: string, dateFormat?: string): Maybe<SimpleDate> {
    const momentDate = moment(dateString, dateFormat, true)
    if (momentDate.isValid()) {
      return {year: momentDate.year(), month: momentDate.month() + 1, day: momentDate.date()}
    }
    return undefined
  }

  it('moment-based custom parsing', () => {
    const config = new Config({parseDateTime: customParseDate, dateFormats: ['Do MMM YY', 'DDD YYYY']})
    const dateHelper = new DateTimeHelper(config)
    expect(dateHelper.dateStringToDateNumber('31st Jan 00')).toEqual(new DateNumber(36556, 'Do MMM YY'))
    expect(dateHelper.dateStringToDateNumber('365 1900')).toEqual(new DateNumber(366, 'DDD YYYY'))
  })
})
