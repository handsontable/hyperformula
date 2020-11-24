/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'
// import

const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#DĚLENÍ_NULOU!',
    ERROR: '#ERROR!',
    NA: '#NENÍ_K_DISPOZICI',
    NAME: '#NÁZEV?',
    NUM: '#ČÍSLO!',
    REF: '#ODKAZ!',
    VALUE: '#HODNOTA!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'ARCCOS',
    ACOSH: 'ARCCOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'A',
    ASIN: 'ARCSIN',
    ASINH: 'ARCSINH',
    ATAN2: 'ARCTG2',
    ATAN: 'ARCTG',
    ATANH: 'ARCTGH',
    AVERAGE: 'PRŮMĚR',
    AVERAGEA: 'AVERAGEA',
    AVERAGEIF: 'AVERAGEIF',
    BASE: 'BASE',
    BIN2DEC: 'BIN2DEC',
    BIN2HEX: 'BIN2HEX',
    BIN2OCT: 'BIN2OCT',
    BITAND: 'BITAND',
    BITLSHIFT: 'BITLSHIFT',
    BITOR: 'BITOR',
    BITRSHIFT: 'BITRSHIFT',
    BITXOR: 'BITXOR',
    CEILING: 'ZAOKR.NAHORU',
    CHAR: 'ZNAK',
    CHOOSE: 'ZVOLIT',
    CLEAN: 'VYČISTIT',
    CODE: 'KÓD',
    COLUMN: 'SLOUPEC',
    COLUMNS: 'SLOUPCE',
    CONCATENATE: 'CONCATENATE',
    CORREL: 'CORREL',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'POČET',
    COUNTA: 'POČET2',
    COUNTBLANK: 'COUNTBLANK',
    COUNTIF: 'COUNTIF',
    COUNTIFS: 'COUNTIFS',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'CUMIPMT',
    CUMPRINC: 'CUMPRINC',
    DATE: 'DATUM',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'DATUMHODN',
    DAY: 'DEN',
    DAYS360: 'ROK360',
    DAYS: 'DAYS',
    DB: 'ODPIS.ZRYCH',
    DDB: 'ODPIS.ZRYCH2',
    DEC2BIN: 'DEC2BIN',
    DEC2HEX: 'DEC2HEX',
    DEC2OCT: 'DEC2OCT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'DEGREES',
    DELTA: 'DELTA',
    DOLLARDE: 'DOLLARDE',
    DOLLARFR: 'DOLLARFR',
    EDATE: 'EDATE',
    EFFECT: "EFFECT",
    EOMONTH: 'EOMONTH',
    ERF: 'ERF',
    ERFC: 'ERFC',
    EVEN: 'ZAOKROUHLIT.NA.SUDÉ',
    EXACT: 'STEJNÉ',
    EXP: 'EXP',
    FALSE: 'NEPRAVDA',
    FIND: 'NAJÍT',
    FORMULATEXT: 'FORMULATEXT',
    FV: 'BUDHODNOTA',
    FVSCHEDULE: 'FVSCHEDULE',
    HEX2BIN: 'HEX2BIN',
    HEX2DEC: 'HEX2DEC',
    HEX2OCT: 'HEX2OCT',
    HLOOKUP: 'VVYHLEDAT',
    HOUR: 'HODINA',
    IF: 'KDYŽ',
    IFERROR: 'IFERROR',
    IFNA: 'IFNA',
    INDEX: 'INDEX',
    INT: 'CELÁ.ČÁST',
    INTERVAL: 'INTERVAL', //FIXME
    IPMT: 'PLATBA.ÚROK',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'JE.PRÁZDNÉ',
    ISERR: 'JE.CHYBA',
    ISERROR: 'JE.CHYBHODN',
    ISEVEN: 'ISEVEN',
    ISFORMULA: 'ISFORMULA',
    ISLOGICAL: 'JE.LOGHODN',
    ISNA: 'JE.NEDEF',
    ISNONTEXT: 'JE.NETEXT',
    ISNUMBER: 'JE.ČISLO',
    ISODD: 'ISODD',
    ISOWEEKNUM: 'ISOWEEKNUM',
    ISPMT: 'ISPMT',
    ISREF: 'JE.ODKAZ',
    ISTEXT: 'JE.TEXT',
    LEFT: 'ZLEVA',
    LEN: 'DÉLKA',
    LN: 'LN',
    LOG10: 'LOG',
    LOG: 'LOGZ',
    LOWER: 'MALÁ',
    MATCH: 'POZVYHLEDAT',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIAN',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'ČÁST',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'MINUTA',
    MIRR: 'MOD.MÍRA.VÝNOSNOSTI',
    MMULT: 'SOUČIN.MATIC',
    MOD: 'MOD',
    MONTH: 'MĚSÍC',
    NA: 'NEDEF',
    NETWORKDAYS: 'NETWORKDAYS',
    'NETWORKDAYS.INTL': 'NETWORKDAYS.INTL',
    NOMINAL: 'NOMINAL',
    NOT: 'NE',
    NOW: 'NYNÍ',
    NPER: 'POČET.OBDOBÍ',
    NPV: 'ČISTÁ.SOUČHODNOTA',
    OCT2BIN: 'OCT2BIN',
    OCT2DEC: 'OCT2DEC',
    OCT2HEX: 'OCT2HEX',
    ODD: 'ZAOKROUHLIT.NA.LICHÉ',
    OFFSET: 'POSUN',
    OR: 'NEBO',
    PDURATION: 'PDURATION',
    PI: 'PI',
    PMT: 'PLATBA',
    PRODUCT: 'SOUČIN',
    POWER: 'POWER',
    PPMT: 'PLATBA.ZÁKLAD',
    PROPER: 'VELKÁ2',
    PV: 'SOUČHODNOTA',
    RADIANS: 'RADIANS',
    RAND: 'NÁHČÍSLO',
    RATE: 'ÚROKOVÁ.MÍRA',
    REPLACE: 'NAHRADIT',
    REPT: 'OPAKOVAT',
    RIGHT: 'ZPRAVA',
    ROUND: 'ZAOKROUHLIT',
    ROUNDDOWN: 'ROUNDDOWN',
    ROUNDUP: 'ROUNDUP',
    ROW: 'ŘÁDEK',
    ROWS: 'ŘÁDKY',
    RRI: 'RRI',
    SEARCH: 'HLEDAT',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEKUNDA',
    SHEET: 'SHEET',
    SHEETS: 'SHEETS',
    SIN: 'SIN',
    SINH: 'SINH',
    SLN: 'ODPIS.LIN',
    SPLIT: 'SPLIT',
    SQRT: 'ODMOCNINA',
    STDEVA: 'STDEVA',
    'STDEV.P': 'SMODCH.P',
    STDEVPA: 'STDEVPA',
    'STDEV.S': 'SMODCH.VÝBĚR.S',
    SUBSTITUTE: 'DOSADIT',
    SUBTOTAL: 'SUBTOTAL',
    SUM: 'SUMA',
    SUMIF: 'SUMIF',
    SUMIFS: 'SUMIFS',
    SUMPRODUCT: 'SOUČIN.SKALÁRNÍ',
    SUMSQ: 'SUMA.ČTVERCŮ',
    SWITCH: '',
    SYD: 'ODPIS.NELIN',
    T: 'T',
    TAN: 'TG',
    TANH: 'TGH',
    TBILLEQ: 'TBILLEQ',
    TBILLPRICE: 'TBILLPRICE',
    TBILLYIELD: 'TBILLYIELD',
    TEXT: 'HODNOTA.NA.TEXT',
    TIME: 'ČAS',
    TIMEVALUE: 'ČASHODN',
    TODAY: 'DNES',
    TRANSPOSE: 'TRANSPOZICE',
    TRIM: 'PROČISTIT',
    TRUE: 'PRAVDA',
    TRUNC: 'USEKNOUT',
    UNICHAR: 'UNICHAR',
    UNICODE: 'UNICODE',
    UPPER: 'VELKÁ',
    VARA: 'VARA',
    'VAR.P': 'VAR.P',
    VARPA: 'VARPA',
    'VAR.S': 'VAR.S',
    VLOOKUP: 'SVYHLEDAT',
    WEEKDAY: 'DENTÝDNE',
    WEEKNUM: 'WEEKNUM',
    WORKDAY: 'WORKDAY',
    'WORKDAY.INTL': 'WORKDAY.INTL',
    XNPV: 'XNPV',
    XOR: 'XOR',
    YEAR: 'ROK',
    YEARFRAC: 'YEARFRAC',
    ROMAN: 'ROMAN',
    ARABIC: 'ARABIC',
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
    VAR: 'VAR.VÝBĚR',
    VARP: 'VAR',
    STDEV: 'SMODCH.VÝBĚR',
    STDEVP: 'SMODCH',
    FACT: 'FAKTORIÁL',
    FACTDOUBLE: 'FACTDOUBLE',
    COMBIN: 'KOMBINACE',
    COMBINA: 'COMBINA',
    GCD: 'GCD',
    LCM: 'LCM',
    MROUND: 'MROUND',
    MULTINOMIAL: 'MULTINOMIAL',
    QUOTIENT: 'QUOTIENT',
    RANDBETWEEN: 'RANDBETWEEN',
    SERIESSUM: 'SERIESSUM',
    SIGN: 'SIGN',
    SQRTPI: 'SQRTPI',
    SUMX2MY2: 'SUMX2MY2',
    SUMX2PY2: 'SUMX2PY2',
    SUMXMY2: 'SUMXMY2',
    'EXPON.DIST': 'EXPON.DIST',
    EXPONDIST: 'EXPONDIST',
    FISHER: 'FISHER',
    FISHERINV: 'FISHERINV',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'GAMMA.DIST',
    'GAMMA.INV': 'GAMMA.INV',
    GAMMADIST: 'GAMMADIST',
    GAMMAINV: 'GAMMAINV',
    GAMMALN: 'GAMMALN',
    'GAMMALN.PRECISE': 'GAMMALN.PRECISE',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'BETA.DIST',
    BETADIST: 'BETADIST',
    'BETA.INV': 'BETA.INV',
    BETAINV: 'BETAINV',
    'BINOM.DIST': 'BINOM.DIST',
    BINOMDIST: 'BINOMDIST',
    'BINOM.INV': 'BINOM.INV',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    CHIDIST: 'CHIDIST',
    CHIINV: 'CHIINV',
    'CHISQ.DIST': 'CHISQ.DIST',
    'CHISQ.DIST.RT': 'CHISQ.DIST.RT',
    'CHISQ.INV': 'CHISQ.INV',
    'CHISQ.INV.RT': 'CHISQ.INV.RT',
    'F.DIST': 'F.DIST',
    'F.DIST.RT': 'F.DIST.RT',
    'F.INV': 'F.INV',
    'F.INV.RT': 'F.INV.RT',
    FDIST: 'FDIST',
    FINV: 'FINV',
    WEIBULL: 'WEIBULL',
    'WEIBULL.DIST': 'WEIBULL.DIST',
    POISSON: 'POISSON',
    'POISSON.DIST': 'POISSON.DIST',
    'HYPGEOM.DIST': 'HYPGEOM.DIST',
    HYPGEOMDIST: 'HYPGEOMDIST',
    'T.DIST': 'T.DIST',
    'T.DIST.2T': 'T.DIST.2T',
    'T.DIST.RT': 'T.DIST.RT',
    'T.INV': 'T.INV',
    'T.INV.2T': 'T.INV.2T',
    TDIST: 'TDIST',
    TINV: 'TINV',
    LOGINV: 'LOGINV',
    'LOGNORM.DIST': 'LOGNORM.DIST',
    'LOGNORM.INV': 'LOGNORM.INV',
    LOGNORMDIST: 'LOGNORMDIST',
    'NORM.DIST': 'NORM.DIST',
    'NORM.INV': 'NORM.INV',
    'NORM.S.DIST': 'NORM.S.DIST',
    'NORM.S.INV': 'NORM.S.INV',
    NORMDIST: 'NORMDIST',
    NORMINV: 'NORMINV',
    NORMSDIST: 'NORMSDIST',
    NORMSINV: 'NORMSINV',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'NEGBINOM.DIST',
    NEGBINOMDIST: 'NEGBINOMDIST',
    'CEILING.MATH': 'CEILING.MATH',
  },
  langCode: 'csCZ',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
