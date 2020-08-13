/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'
// import

const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYKL!',
    DIV_BY_ZERO: '#DZIEL/0!',
    ERROR: '#BŁĄD!',
    NA: '#N/A',
    NAME: '#NAZWA?',
    NUM: '#LICZBA!',
    REF: '#ADR!',
    VALUE: '#ARG!',
  },
  functions: {
    ABS: 'WART.BEZWGL',
    ACOS: 'ACOS',
    ACOSH: 'ACOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'ORAZ',
    ASIN: 'ASIN',
    ASINH: 'ASINH',
    ATAN: 'ATAN',
    ATAN2: 'ATAN2',
    ATANH: 'ATANH',
    AVERAGE: 'ŚREDNIA',
    AVERAGEA: 'ŚREDNIA.A',
    AVERAGEIF: 'ŚREDNIA.JEŻELI',
    BASE: 'PODSTAWA',
    BIN2DEC: 'DWÓJK.NA.DZIES',
    BIN2HEX: 'DWÓJK.NA.SZESN',
    BIN2OCT: 'DWÓJK.NA.ÓSM',
    BITAND: 'BITAND',
    BITLSHIFT: 'BITLSHIFT',
    BITOR: 'BITOR',
    BITRSHIFT: 'BITRSHIFT',
    BITXOR: 'BITXOR',
    CEILING: 'ZAOKR.W.GÓRĘ',
    CHAR: 'ZNAK',
    CHOOSE: 'WYBIERZ',
    CLEAN: 'OCZYŚĆ',
    CODE: 'KOD',
    COLUMNS: 'LICZBA.KOLUMN',
    CONCATENATE: 'ZŁĄCZ.TEKST',
    CORREL: 'WSP.KORELACJI',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'COUNT',
    COUNTA: 'COUNTA',
    COUNTBLANK: 'LICZ.PUSTE',
    COUNTIF: 'LICZ.JEŻELI',
    COUNTIFS: 'LICZ.WARUNKI',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'SPŁAC.ODS',
    CUMPRINC: 'SPŁAC.KAPIT',
    DATE: 'DATA',
    DAY: 'DZIEŃ',
    DAYS: 'DNI',
    DB: 'DB',
    DDB: 'DDB',
    DEC2BIN: 'DZIES.NA.DWÓJK',
    DEC2HEX: 'DZIES.NA.SZESN',
    DEC2OCT: 'DZIES.NA.ÓSM',
    DECIMAL: 'DZIESIĘTNA',
    DEGREES: 'STOPNIE',
    DELTA: 'DELTA',
    DOLLARDE: 'CENA.DZIES',
    DOLLARFR: 'CENA.UŁAM',
    EFFECT: "EFEKTYWNA",
    EOMONTH: 'NR.SER.OST.DN.MIEŚ',
    ERF: 'FUNKCJA.BŁ',
    ERFC: 'KOMP.FUNKCJA.BŁ',
    EVEN: 'ZAOKR.DO.PARZ',
    EXP: 'EXP',
    FALSE: 'FAŁSZ',
    FIND: 'ZNAJDŹ',
    FORMULATEXT: 'FORMUŁA.TEKST',
    FV: 'FV',
    IF: 'JEŻELI',
    IFERROR: 'JEŻELI.BŁĄD',
    IFNA: 'JEŻELI.ND',
    INDEX: 'INDEKS',
    INT: 'ZAOKR.DO.CAŁK',
    IPMT: 'IPMT',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'CZY.PUSTA',
    ISERR: 'CZY.BŁ',
    ISERROR: 'CZY.BŁĄD',
    ISEVEN: 'CZY.PARZYSTE',
    ISFORMULA: 'CZY.FORMUŁA',
    ISLOGICAL: 'CZY.LOGICZNA',
    ISNA: 'CZY.BRAK',
    ISNONTEXT: 'CZY.NIE.TEKST',
    ISNUMBER: 'CZY.LICZBA',
    ISODD: 'CZY.NIEPARZYSTE',
    ISREF: 'CZY.ADR',
    ISTEXT: 'CZY.TEKST',
    LEFT: 'LEWY',
    LEN: 'DŁ',
    LN: 'LN',
    LOG: 'LOG',
    LOG10: 'LOG10',
    MATCH: 'PODAJ.POZYCJĘ',
    MAX: 'MAKS',
    MAXA: 'MAX.A',
    MAXPOOL: 'MAKS.Z.PULI',
    MEDIAN: 'MEDIANA',
    MEDIANPOOL: 'MEDIANA.Z.PULI',
    MIN: 'MIN',
    MINA: 'MIN.A',
    MMULT: 'MACIERZ.ILOCZYN',
    MOD: 'MOD',
    MONTH: 'MIESIĄC',
    NA: 'BRAK',
    NOT: 'NIE',
    ODD: 'ZAOKR.DO.NPARZ',
    OFFSET: 'PRZESUNIĘCIE',
    OR: 'LUB',
    PI: 'PI',
    PMT: 'PMT',
    POWER: 'POTĘGA',
    PPMT: 'PPMT',
    PROPER: 'Z.WIELKIEJ.LITERY',
    RADIANS: 'RADIANY',
    RAND: 'LOSUJ',
    REPT: 'POWT',
    RIGHT: 'PRAWY',
    ROUND: 'ZAOKR',
    ROUNDDOWN: 'ZAOKR.DÓŁ',
    ROUNDUP: 'ZAOKR.GÓRA',
    ROWS: 'ILE.WIERSZY',
    SEARCH: 'SZUKAJ.TEKST',
    SEC: 'SEC',
    SECH: 'SECH',
    SHEETS: 'ARKUSZE',
    SHEET: 'ARKUSZ',
    SIN: 'SIN',
    SINH: 'SINH',
    SPLIT: 'PODZIEL.TEKST',
    SQRT: 'PIERWIASTEK',
    SUM: 'SUMA',
    SUMIF: 'SUMA.JEŻELI',
    SUMIFS: 'SUMY.JEŻELI',
    SUMPRODUCT: 'SUMA.ILOCZYNÓW',
    SUMSQ: 'SUMSQ',
    SWITCH: 'PRZEŁĄCZ',
    TAN: 'TAN',
    TANH: 'TANH',
    TEXT: 'TEKST',
    TRANSPOSE: 'TRANSPONUJ',
    TRIM: 'USUŃ.ZBĘDNE.ODSTĘPY',
    TRUE: 'PRAWDA',
    TRUNC: 'LICZBA.CAŁK',
    VLOOKUP: 'WYSZUKAJ.PIONOWO',
    XOR: 'XOR',
    YEAR: 'ROK',
  },
  langCode: 'plPL',
  ui: {
    NEW_SHEET_PREFIX: 'Arkusz',
  },
}

export default dictionary
