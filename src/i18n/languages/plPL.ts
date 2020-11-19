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
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
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
    COLUMN: 'NR.KOLUMNY',
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
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'DATA.WARTOŚĆ',
    DAY: 'DZIEŃ',
    DAYS360: 'DNI.360',
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
    EDATE: 'NR.SER.DATY',
    EFFECT: "EFEKTYWNA",
    EOMONTH: 'NR.SER.OST.DN.MIEŚ',
    ERF: 'FUNKCJA.BŁ',
    ERFC: 'KOMP.FUNKCJA.BŁ',
    EVEN: 'ZAOKR.DO.PARZ',
    EXACT: 'PORÓWNAJ',
    EXP: 'EXP',
    FALSE: 'FAŁSZ',
    FIND: 'ZNAJDŹ',
    FORMULATEXT: 'FORMUŁA.TEKST',
    FV: 'FV',
    FVSCHEDULE: 'WART.PRZYSZŁ.KAP',
    HEX2BIN: 'SZESN.NA.DWÓJK',
    HEX2DEC: 'SZESN.NA.DZIES',
    HEX2OCT: 'SZESN.NA.ÓSM',
    HLOOKUP: 'WYSZUKAJ.POZIOMO',
    HOUR: 'GODZINA',
    IF: 'JEŻELI',
    IFERROR: 'JEŻELI.BŁĄD',
    IFNA: 'JEŻELI.ND',
    INDEX: 'INDEKS',
    INT: 'ZAOKR.DO.CAŁK',
    INTERVAL: 'INTERVAL', //FIXME
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
    ISOWEEKNUM: 'ISO.NUM.TYG',
    ISPMT: 'ISPMT',
    ISREF: 'CZY.ADR',
    ISTEXT: 'CZY.TEKST',
    LEFT: 'LEWY',
    LEN: 'DŁ',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'LITERY.MAŁE',
    MATCH: 'PODAJ.POZYCJĘ',
    MAX: 'MAKS',
    MAXA: 'MAX.A',
    MAXPOOL: 'MAKS.Z.PULI',
    MEDIAN: 'MEDIANA',
    MEDIANPOOL: 'MEDIANA.Z.PULI',
    MID: 'FRAGMENT.TEKSTU',
    MIN: 'MIN',
    MINA: 'MIN.A',
    MINUTE: 'MINUTA',
    MIRR: 'MIRR',
    MMULT: 'MACIERZ.ILOCZYN',
    MOD: 'MOD',
    MONTH: 'MIESIĄC',
    NA: 'BRAK',
    NETWORKDAYS: 'DNI.ROBOCZE',
    'NETWORKDAYS.INTL': 'DNI.ROBOCZE.NIESTAND',
    NOMINAL: 'NOMINALNA',
    NOT: 'NIE',
    NOW: 'TERAZ',
    NPER: 'NPER',
    NPV: 'NPV',
    OCT2BIN: 'ÓSM.NA.DWÓJK',
    OCT2DEC: 'ÓSM.NA.DZIES',
    OCT2HEX: 'ÓSM.NA.SZESN',
    ODD: 'ZAOKR.DO.NPARZ',
    OFFSET: 'PRZESUNIĘCIE',
    OR: 'LUB',
    PDURATION: 'ROCZ.PRZYCH',
    PI: 'PI',
    PMT: 'PMT',
    PRODUCT: 'ILOCZYN',
    POWER: 'POTĘGA',
    PPMT: 'PPMT',
    PROPER: 'Z.WIELKIEJ.LITERY',
    PV: 'PV',
    RADIANS: 'RADIANY',
    RAND: 'LOSUJ',
    RATE: 'RATE',
    REPLACE: 'ZASTĄP',
    REPT: 'POWT',
    RIGHT: 'PRAWY',
    ROUND: 'ZAOKR',
    ROUNDDOWN: 'ZAOKR.DÓŁ',
    ROUNDUP: 'ZAOKR.GÓRA',
    ROW: 'WIERSZ',
    ROWS: 'ILE.WIERSZY',
    RRI: 'RÓWNOW.STOPA.PROC',
    SEARCH: 'SZUKAJ.TEKST',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEKUNDA',
    SHEET: 'ARKUSZ',
    SHEETS: 'ARKUSZE',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'SLN',
    SPLIT: 'PODZIEL.TEKST',
    SQRT: 'PIERWIASTEK',
    STDEVA: 'ODCH.STANDARDOWE.A',
    'STDEV.P': 'ODCH.STAND.POPUL',
    STDEVPA: 'ODCH.STANDARD.POPUL.A',
    'STDEV.S': 'ODCH.STANDARD.PRÓBKI',
    SUBSTITUTE: 'PODSTAW',
    SUBTOTAL: 'SUMY.CZĘŚCIOWE',
    SUM: 'SUMA',
    SUMIF: 'SUMA.JEŻELI',
    SUMIFS: 'SUMY.JEŻELI',
    SUMPRODUCT: 'SUMA.ILOCZYNÓW',
    SUMSQ: 'SUMSQ',
    SWITCH: 'PRZEŁĄCZ',
    SYD: 'SYD',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'RENT.EKW.BS',
    TBILLPRICE: 'CENA.BS',
    TBILLYIELD: 'RENT.BS',
    TEXT: 'TEKST',
    TIME: 'CZAS',
    TIMEVALUE: 'CZAS.WARTOŚĆ',
    TODAY: 'DZIŚ',
    TRANSPOSE: 'TRANSPONUJ',
    TRIM: 'USUŃ.ZBĘDNE.ODSTĘPY',
    TRUE: 'PRAWDA',
    TRUNC: 'LICZBA.CAŁK',
    UNICHAR: 'ZNAK.UNICODE',
    UNICODE: 'UNICODE',
    UPPER: 'LITERY.WIELKIE',
    VARA: 'WARIANCJA.A',
    'VAR.P': 'WARIANCJA.POP',
    VARPA: 'WARIANCJA.POPUL.A',
    'VAR.S': 'WARIANCJA.PRÓBKI',
    VLOOKUP: 'WYSZUKAJ.PIONOWO',
    WEEKDAY: 'DZIEŃ.TYG',
    WEEKNUM: 'NUM.TYG',
    WORKDAY: 'DZIEŃ.ROBOCZY',
    'WORKDAY.INTL': 'DZIEŃ.ROBOCZY.NIESTAND',
    XNPV: 'XNPV',
    XOR: 'XOR',
    YEAR: 'ROK',
    YEARFRAC: 'CZĘŚĆ.ROKU',
    ROMAN: 'RZYMSKIE',
    ARABIC: 'ARABSKA',
    'HF.ADD': 'HF.ADD',
    'HF.CONCAT': 'HF.CONCAT',
    'HF.DIVIDE': 'HF.DIVIDE',
    'HF.EQ': 'HF.EQ',
    'HF.GT': 'HF.GT',
    'HF.GTE': 'HF.GTE',
    'HF.LT': 'HF.LT',
    'HF.LTE': 'HF.LTE',
    'HF.MINUS': 'HF.MINUS',
    'HF.MULTIPLY': 'HF.MULTIPLY',
    'HF.NE': 'HF.NE',
    'HF.POW': 'HF.POW',
    'HF.UMINUS': 'HF.UMINUS',
    'HF.UNARY_PERCENT': 'HF.UNARY_PERCENT',
    'HF.UPLUS': 'HF.UPLUS',
    VAR: 'WARIANCJA',
    VARP: 'WARIANCJA.POPUL',
    STDEV: 'ODCH.STANDARDOWE',
    STDEVP: 'ODCH.STANDARD.POPUL',
    FACT: 'SILNIA',
    FACTDOUBLE: 'SILNIA.DWUKR',
    COMBIN: 'KOMBINACJE',
    COMBINA: 'KOMBINACJE.A',
    GCD: 'NAJW.WSP.DZIEL',
    LCM: 'NAJMN.WSP.WIEL',
    MROUND: 'ZAOKR.DO.WIELOKR',
    MULTINOMIAL: 'WIELOMIAN',
    QUOTIENT: 'CZ.CAŁK.DZIELENIA',
    RANDBETWEEN: 'LOS.ZAKR',
    SERIESSUM: 'SUMA.SZER.POT',
    SIGN: 'ZNAK.LICZBY',
    SQRTPI: 'PIERW.PI',
    SUMX2MY2: 'SUMA.X2.M.Y2',
    SUMX2PY2: 'SUMA.X2.P.Y2',
    SUMXMY2: 'SUMA.XMY.2',
    'EXPON.DIST': 'ROZKŁ.EXP',
    EXPONDIST: 'ROZKŁAD.EXP',
    FISHER: 'ROZKŁAD.FISHER',
    FISHERINV: 'ROZKŁAD.FISHER.ODW',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'ROZKŁ.GAMMA',
    'GAMMA.INV': 'ROZKŁ.GAMMA.ODWR',
    GAMMADIST: 'ROZKŁAD.GAMMA',
    GAMMAINV: 'ROZKŁAD.GAMMA.ODW',
    GAMMALN: 'ROZKŁAD.LIN.GAMMA',
    'GAMMALN.PRECISE': 'ROZKŁAD.LIN.GAMMA.DOKŁ',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'ROZKŁ.BETA',
    BETADIST: 'ROZKŁAD.BETA',
    'BETA.INV': 'ROZKŁ.BETA.ODWR',
    BETAINV: 'ROZKŁAD.BETA.ODW',
    'BINOM.DIST': 'ROZKŁ.DWUM',
    BINOMDIST: 'ROZKŁAD.DWUM',
    'BINOM.INV': 'ROZKŁ.DWUM.ODWR',
    BESSELI: 'BESSEL.I',
    BESSELJ: 'BESSEL.J',
    BESSELK: 'BESSEL.K',
    BESSELY: 'BESSEL.Y',
    CHIDIST: 'ROZKŁAD.CHI',
    CHIINV: 'ROZKŁAD.CHI.ODW',
    'CHISQ.DIST': 'ROZKŁ.CHI',
    'CHISQ.DIST.RT': 'ROZKŁ.CHI.PŚ',
    'CHISQ.INV': 'ROZKŁ.CHI.ODWR',
    'CHISQ.INV.RT': 'ROZKŁ.CHI.ODWR.PŚ',
    'F.DIST': 'ROZKŁ.F',
    'F.DIST.RT': 'ROZKŁ.F.PŚ',
    'F.INV': 'ROZKŁ.F.ODWR',
    'F.INV.RT': 'ROZKŁ.F.ODWR.PŚ',
    FDIST: 'ROZKŁAD.F',
    FINV: 'ROZKŁAD.F.ODW',
    WEIBULL: 'ROZKŁAD.WEIBULL',
    'WEIBULL.DIST': 'ROZKŁ.WEIBULL',
    POISSON: 'ROZKŁAD.POISSON',
    'POISSON.DIST': 'ROZKŁ.POISSON',
    'HYPGEOM.DIST': 'ROZKŁ.HIPERGEOM',
    HYPGEOMDIST: 'ROZKŁAD.HIPERGEOM',
    'T.DIST': 'ROZKŁ.T.PS',
    'T.DIST.2T': 'ROZKŁ.T.DŚ',
    'T.DIST.RT': 'ROZKŁ.T.PŚ',
    'T.INV': 'ROZKŁ.T.ODWR',
    'T.INV.2T': 'ROZKŁ.T.ODWR.DŚ',
    TDIST: 'ROZKŁAD.T',
    TINV: 'ROZKŁAD.T.ODW',
    LOGINV: 'ROZKŁAD.LOG.ODW',
    'LOGNORM.DIST': 'ROZKŁ.LOG',
    'LOGNORM.INV': 'ROZKŁ.LOG.ODWR',
    LOGNORMDIST: 'ROZKŁAD.LOG',
    'NORM.DIST': 'ROZKŁ.NORMALNY',
    'NORM.INV': 'ROZKŁ.NORMALNY.ODWR',
    'NORM.S.DIST': 'ROZKŁ.NORMALNY.S',
    'NORM.S.INV': 'ROZKŁ.NORMALNY.S.ODWR',
    NORMDIST: 'ROZKŁAD.NORMALNY',
    NORMINV: 'ROZKŁAD.NORMALNY.ODW',
    NORMSDIST: 'ROZKŁAD.NORMALNY.S',
    NORMSINV: 'ROZKŁAD.NORMALNY.S.ODW',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'ROZKŁ.DWUM.PRZEC',
    NEGBINOMDIST: 'ROZKŁAD.DWUM.PRZEC',
    LARGE: 'MAX.K',
    SMALL: 'MIN.K',
    AVEDEV: 'ODCH.ŚREDNIE',
    CONFIDENCE: 'UFNOŚĆ',
    'CONFIDENCE.NORM': 'UFNOŚĆ.NORM',
    'CONFIDENCE.T': 'UFNOŚĆ.T',
    DEVSQ: 'ODCH.KWADRATOWE',
    GEOMEAN: 'ŚREDNIA.GEOMETRYCZNA',
    HARMEAN: 'ŚREDNIA.HARMONICZNA',
    CRITBINOM: 'PRÓG.ROZKŁAD.DWUM',
    PEARSON: 'PEARSON',
    RSQ: 'R.KWADRAT',
    STANDARDIZE: 'NORMALIZUJ',
    'Z.TEST': 'Z.TEST',
    ZTEST: 'TEST.Z',
    'F.TEST': 'F.TEST',
    FTEST: 'TEST.F',
  },
  langCode: 'plPL',
  ui: {
    NEW_SHEET_PREFIX: 'Arkusz',
  },
}

export default dictionary
