/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'
// import

const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#SAYI/0!',
    ERROR: '#ERROR!',
    NA: '#YOK',
    NAME: '#AD?',
    NUM: '#SAYI!',
    REF: '#BAŞV!',
    VALUE: '#DEĞER!',
  },
  functions: {
    ABS: 'MUTLAK',
    ACOS: 'ACOS',
    ACOSH: 'ACOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'VE',
    ASIN: 'ASİN',
    ASINH: 'ASİNH',
    ATAN: 'ATAN',
    ATAN2: 'ATAN2',
    ATANH: 'ATANH',
    AVERAGE: 'ORTALAMA',
    AVERAGEA: 'ORTALAMAA',
    AVERAGEIF: 'EĞERORTALAMA',
    BASE: 'TABAN',
    BIN2DEC: 'BIN2DEC',
    BIN2HEX: 'BIN2HEX',
    BIN2OCT: 'BIN2OCT',
    BITAND: 'BİTVE',
    BITLSHIFT: 'BİTSOLAKAYDIR',
    BITOR: 'BİTVEYA',
    BITRSHIFT: 'BİTSAĞAKAYDIR',
    BITXOR: 'BİTÖZELVEYA',
    CEILING: 'TAVANAYUVARLA',
    CHAR: 'DAMGA',
    CHOOSE: 'ELEMAN',
    CLEAN: 'TEMİZ',
    CODE: 'KOD',
    COLUMNS: 'SÜTUNSAY',
    CONCATENATE: 'BİRLEŞTİR',
    CORREL: 'KORELASYON',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'SAY',
    COUNTA: 'BAĞ_DEĞ_DOLU_SAY',
    COUNTBLANK: 'BOŞLUKSAY',
    COUNTIF: 'EĞERSAY',
    COUNTIFS: 'ÇOKEĞERSAY',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'TOPÖDENENFAİZ',
    CUMPRINC: 'TOPANAPARA',
    DATE: 'TARİH',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'TARİHSAYISI',
    DAY: 'GÜN',
    DAYS: 'GÜNSAY',
    DB: 'AZALANBAKİYE',
    DDB: 'ÇİFTAZALANBAKİYE',
    DAYS360: 'GÜN360',
    DEC2BIN: 'DEC2BIN',
    DEC2HEX: 'DEC2HEX',
    DEC2OCT: 'DEC2OCT',
    DECIMAL: 'ONDALIK',
    DEGREES: 'DERECE',
    DELTA: 'DELTA',
    DOLLARDE: 'LİRAON',
    DOLLARFR: 'LİRAKES',
    EFFECT: "ETKİN",
    EDATE: 'SERİTARİH',
    EOMONTH: 'SERİAY',
    ERF: 'HATAİŞLEV',
    ERFC: 'TÜMHATAİŞLEV',
    EVEN: 'ÇİFT',
    EXP: 'ÜS',
    FALSE: 'YANLIŞ',
    FIND: 'BUL',
    FORMULATEXT: 'FORMÜLMETNİ',
    FV: 'GD',
    HOUR: 'SAAT',
    IF: 'EĞER',
    IFERROR: 'EĞERHATA',
    IFNA: 'EĞERYOKSA',
    INDEX: 'İNDİS',
    INT: 'TAMSAYI',
    IPMT: 'FAİZTUTARI',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'EBOŞSA',
    ISERR: 'EHATA',
    ISERROR: 'EHATALIYSA',
    ISEVEN: 'ÇİFTMİ',
    ISFORMULA: 'EFORMÜLSE',
    ISLOGICAL: 'EMANTIKSALSA',
    ISNA: 'EYOKSA',
    ISNONTEXT: 'EMETİNDEĞİLSE',
    ISNUMBER: 'ESAYIYSA',
    ISODD: 'TEKMİ',
    ISPMT: 'ISPMT',
    ISOWEEKNUM: 'ISOHAFTASAY',
    ISREF: 'EREFSE',
    ISTEXT: 'EMETİNSE',
    LEFT: 'SOL',
    LEN: 'UZUNLUK',
    LN: 'LN',
    LOG: 'LOG',
    LOG10: 'LOG10',
    MATCH: 'KAÇINCI',
    MAX: 'MAK',
    MAXA: 'MAKA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'ORTANCA',
    MEDIANPOOL: 'MEDIANPOOL',
    MIN: 'MİN',
    MINA: 'MİNA',
    MINUTE: 'DAKİKA',
    MMULT: 'DÇARP',
    MOD: 'MOD',
    MONTH: 'AY',
    NA: 'YOKSAY',
    NOMINAL: 'NOMİNAL',
    NOW: 'ŞİMDİ',
    NOT: 'DEĞİL',
    NPER: 'TAKSİT_SAYISI',
    ODD: 'TEK',
    OFFSET: 'KAYDIR',
    OR: 'VEYA',
    PI: 'Pİ',
    PMT: 'DEVRESEL_ÖDEME',
    POWER: 'KUVVET',
    PPMT: 'ANA_PARA_ÖDEMESİ',
    PROPER: 'YAZIM.DÜZENİ',
    RADIANS: 'RADYAN',
    RAND: 'S_SAYI_ÜRET',
    RATE: 'FAİZ_ORANI',
    REPT: 'YİNELE',
    RIGHT: 'SAĞ',
    ROUND: 'YUVARLA',
    ROUNDDOWN: 'AŞAĞIYUVARLA',
    ROUNDUP: 'YUKARIYUVARLA',
    ROWS: 'SATIRSAY',
    SEARCH: 'MBUL',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SANİYE',
    SHEETS: 'SAYFALAR',
    SHEET: 'SAYFA',
    SIN: 'SİN',
    SINH: 'SINH',
    SPLIT: 'SPLIT',
    SQRT: 'KAREKÖK',
    SUM: 'TOPLA',
    SUMIF: 'ETOPLA',
    SUMIFS: 'ÇOKETOPLA',
    SUMPRODUCT: 'TOPLA.ÇARPIM',
    SUMSQ: 'TOPKARE',
    SWITCH: '',
    TAN: 'TAN',
    TANH: 'TANH',
    TEXT: 'METNEÇEVİR',
    TIME: 'ZAMAN',
    TIMEVALUE: 'ZAMANSAYISI',
    TODAY: 'BUGÜN',
    TRANSPOSE: 'DEVRİK_DÖNÜŞÜM',
    TRIM: 'KIRP',
    TRUE: 'DOĞRU',
    TRUNC: 'NSAT',
    VLOOKUP: 'DÜŞEYARA',
    WEEKDAY: 'HAFTANINGÜNÜ',
    WEEKNUM: 'HAFTASAY',
    XOR: 'ÖZELVEYA',
    YEAR: 'YIL',
    YEARFRAC: 'YILORAN',
    PV: 'BD',
    RRI: 'GERÇEKLEŞENYATIRIMGETİRİSİ',
    SLN: 'DA',
  },
  langCode: 'trTR',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
