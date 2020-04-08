import {Config} from '../src/Config'
import {DateTimeHelper, SimpleDate} from '../src/DateTimeHelper'
import moment from 'moment'
import {Maybe} from '../src/Maybe'
import './testConfig'

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
    expect(dateHelper.numberToDate(0).month).toEqual(12)
    expect(dateHelper.numberToDate(2).month).toEqual(1)
    expect(dateHelper.numberToDate(43465).month).toEqual(12)
  })

  it('#stringToDateNumber - tests expected to return not null, dates', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('08/16/1985')).toBe(31275)
    expect(dateHelper.dateStringToDateNumber('01/15/2020')).toBe(43845)
    expect(dateHelper.dateStringToDateNumber('02/29/2000')).toBe(36585)
    expect(dateHelper.dateStringToDateNumber('12/31/2999')).toBe(401768)
    expect(dateHelper.dateStringToDateNumber('12 31 2999')).toBe(401768)
    expect(dateHelper.dateStringToDateNumber(' 12 31 2999 ')).toBe(401768)
    expect(dateHelper.dateStringToDateNumber('12  31 2999')).toBe(401768)
  })

  it('#stringToDateNumber - tests expected to return not null, times', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('00:00')).toBe(0)
    expect(dateHelper.dateStringToDateNumber('03:00')).toBe(0.125)
    expect(dateHelper.dateStringToDateNumber('24:00')).toBe(1)
    expect(dateHelper.dateStringToDateNumber('48:00')).toBe(2)
    expect(dateHelper.dateStringToDateNumber('00:01')).toBe(0.0006944444444444445)
    expect(dateHelper.dateStringToDateNumber('00:00:00')).toBe(0)
    expect(dateHelper.dateStringToDateNumber('00:00:01')).toBe(0.000011574074074074073)
    expect(dateHelper.dateStringToDateNumber('00:179:60')).toBe(0.125)
  })

  it('#stringToDateNumber am/pm', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('03:00 am')).toBe(0.125)
    expect(dateHelper.dateStringToDateNumber('03:00 pm')).toBe(0.625)
    expect(dateHelper.dateStringToDateNumber('12:00 pm')).toBe(0.5)
    expect(dateHelper.dateStringToDateNumber('00:00 pm')).toBe(0.5)
    expect(dateHelper.dateStringToDateNumber('12:59 pm')).toBe(0.5409722222222222)
    expect(dateHelper.dateStringToDateNumber('12:00 am')).toBe(0.0)
    expect(dateHelper.dateStringToDateNumber('00:00 am')).toBe(0.0)
    expect(dateHelper.dateStringToDateNumber('12:59 am')).toBe(0.04097222222222222)
    expect(dateHelper.dateStringToDateNumber('13:00 am')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('13:00 pm')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('pm')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('02/02/2020 pm')).toBe(undefined)
    expect(dateHelper.dateStringToDateNumber('02/02/2020 12:00pm')).toBe(43863.5)
    expect(dateHelper.dateStringToDateNumber('02/02/2020 12:9999pm')).toBe(43870.44375)
  })

  it('#stringToDateNumber - tests expected to return not null, dates + times', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('08/16/1985 03:40')).toBe(31275.152777777777)
    expect(dateHelper.dateStringToDateNumber(' 12 31 2999 00:00:00 ')).toBe(401768)
  })

  it('#stringToDateNumber - excel compatibility', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('02/29/1900')).toBe(undefined)
    const dateHelper2 = new DateTimeHelper(new Config({leapYear1900: true}))
    expect(dateHelper2.dateStringToDateNumber('02/29/1900')).toBe(61)
  })

  it('stringToDateNumber - 00 year parsing', () => {
    const dateHelper = new DateTimeHelper(new Config())
    expect(dateHelper.dateStringToDateNumber('08/16/85')).toBe(31275)
    expect(dateHelper.dateStringToDateNumber('01/15/20')).toBe(43845)
    expect(dateHelper.dateStringToDateNumber('02/29/00')).toBe(36585)
    expect(dateHelper.dateStringToDateNumber('12/31/99')).toBe(36525)
    const dateHelper1 = new DateTimeHelper(new Config({nullYear: 0}))
    expect(dateHelper1.dateStringToDateNumber('01/15/20')).toBe(7320)
    const dateHelper2 = new DateTimeHelper(new Config({nullYear: 100}))
    expect(dateHelper2.dateStringToDateNumber('12/31/99')).toBe(73050)
  })

  it('stringToDateNumber - other date formats', () => {
    const dateHelper = new DateTimeHelper(new Config({dateFormats : ['MM/DD/YYYY']}))
    expect(dateHelper.dateStringToDateNumber('12/31/99')).toBe(undefined)
    const dateHelper1 = new DateTimeHelper(new Config({dateFormats : ['YY/MM/DD']}))
    expect(dateHelper1.dateStringToDateNumber('99/12/31')).toBe(36525)
    const dateHelper2 = new DateTimeHelper(new Config({dateFormats : ['MM/DD/YY', 'YY/MM/DD']}))
    expect(dateHelper2.dateStringToDateNumber('99/12/31')).toBe(36525)
  })

  it('stringToDateNumber - other time formats', () => {
    const dateHelper = new DateTimeHelper(new Config({timeFormats : ['mm:hh']}))
    expect(dateHelper.dateStringToDateNumber('60:02')).toBe(0.125)
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
    expect(dateHelper.numberToDate(0).month).toEqual(6)
    expect(dateHelper.numberToDate(2).month).toEqual(6)
    expect(dateHelper.numberToDate(43465).month).toEqual(6)
  })

  it('#stringToDateNumber - tests expected to return not null, different zero date', () => {
    const dateHelper = new DateTimeHelper(new Config({nullDate: {year: 1950, month: 6, day: 15}}))
    expect(dateHelper.dateStringToDateNumber('08/16/1985')).toBe(12846)
    expect(dateHelper.dateStringToDateNumber('01/15/2020')).toBe(25416)
    expect(dateHelper.dateStringToDateNumber('02/29/2000')).toBe(18156)
    expect(dateHelper.dateStringToDateNumber('12/31/2999')).toBe(383339)
  })
})



describe('Custom date parsing', () => {

  function customParseDate(dateString: string, dateFormat: string): Maybe<SimpleDate> {
    const momentDate = moment(dateString, dateFormat, true)
    if(momentDate.isValid()){
      return {year: momentDate.year(), month: momentDate.month()+1, day: momentDate.date()}
    }
    return undefined
  }

  it( 'moment-based custom parsing', () => {
    const config = new Config({parseDateTime: customParseDate, dateFormats: ['Do MMM YY', 'DDD YYYY']})
    const dateHelper = new DateTimeHelper(config)
    expect(dateHelper.dateStringToDateNumber('31st Jan 00')).toBe(36556)
    expect(dateHelper.dateStringToDateNumber('365 1900')).toBe(366)
  })
})
