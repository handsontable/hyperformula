/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'
// import

export const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#¡DIV/0!',
    ERROR: '#ERROR!',
    NA: '#N/D',
    NAME: '#¿NOMBRE?',
    NUM: '#¡NUM!',
    REF: '#¡REF!',
    VALUE: '#¡VALOR!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'ACOS',
    ACOSH: 'ACOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'Y',
    ASIN: 'ASENO',
    ASINH: 'ASENOH',
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
    ATANH: 'ATANH',
    AVERAGE: 'PROMEDIO',
    AVERAGEA: 'PROMEDIOA',
    AVERAGEIF: 'PROMEDIO.SI',
    BASE: 'BASE',
    BIN2DEC: 'BIN.A.DEC',
    BIN2HEX: 'BIN.A.HEX',
    BIN2OCT: 'BIN.A.OCT',
    BITAND: 'BITAND',
    BITLSHIFT: 'BITLSHIFT',
    BITOR: 'BITOR',
    BITRSHIFT: 'BITRSHIFT',
    BITXOR: 'BITXOR',
    CEILING: 'MULTIPLO.SUPERIOR',
    CHAR: 'CARACTER',
    CHOOSE: 'ELEGIR',
    CLEAN: 'LIMPIAR',
    CODE: 'CODIGO',
    COLUMN: 'COLUMNA',
    COLUMNS: 'COLUMNAS',
    CONCATENATE: 'CONCATENAR',
    CORREL: 'COEF.DE.CORREL',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'CONTAR',
    COUNTA: 'CONTARA',
    COUNTBLANK: 'CONTAR.BLANCO',
    COUNTIF: 'CONTAR.SI',
    COUNTIFS: 'CONTAR.SI.CONJUNTO',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'CSC',
    CSCH: 'CSCH',
    CUMIPMT: 'PAGO.INT.ENTRE',
    CUMPRINC: 'PAGO.PRINC.ENTRE',
    DATE: 'FECHA',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'FECHANUMERO',
    DAY: 'DIA',
    DAYS360: 'DIAS360',
    DAYS: 'DÍAS',
    DB: 'DB',
    DDB: 'DDB',
    DEC2BIN: 'DEC.A.BIN',
    DEC2HEX: 'DEC.A.HEX',
    DEC2OCT: 'DEC.A.OCT',
    DECIMAL: 'CONV.DECIMAL',
    DEGREES: 'GRADOS',
    DELTA: 'DELTA',
    DOLLARDE: 'MONEDA.DEC',
    DOLLARFR: 'MONEDA.FRAC',
    EDATE: 'FECHA.MES',
    EFFECT: "INT.EFECTIVO",
    EOMONTH: 'FIN.MES',
    ERF: 'FUN.ERROR',
    ERFC: 'FUN.ERROR.COMPL',
    EVEN: 'REDONDEA.PAR',
    EXACT: 'IGUAL',
    EXP: 'EXP',
    FALSE: 'FALSO',
    FIND: 'ENCONTRAR',
    FORMULATEXT: 'FORMULATEXTO',
    FV: 'VF',
    FVSCHEDULE: 'VF.PLAN',
    HEX2BIN: 'HEX.A.BIN',
    HEX2DEC: 'HEX.A.DEC',
    HEX2OCT: 'HEX.A.OCT',
    HLOOKUP: 'BUSCARH',
    HOUR: 'HORA',
    IF: 'SI',
    IFERROR: 'SI.ERROR',
    IFNA: 'IFNA',
    INDEX: 'INDICE',
    INT: 'ENTERO',
    INTERVAL: 'INTERVAL', //FIXME
    IPMT: 'PAGOINT',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ESBLANCO',
    ISERR: 'ESERR',
    ISERROR: 'ESERROR',
    ISEVEN: 'ES.PAR',
    ISFORMULA: 'ISFORMULA',
    ISLOGICAL: 'ESLOGICO',
    ISNA: 'ESNOD',
    ISNONTEXT: 'ESNOTEXTO',
    ISNUMBER: 'ESNUMERO',
    ISODD: 'ES.IMPAR',
    ISOWEEKNUM: 'ISOWEEKNUM',
    ISPMT: 'INT.PAGO.DIR',
    ISREF: 'ESREF',
    ISTEXT: 'ESTEXTO',
    LEFT: 'IZQUIERDA',
    LEN: 'LARGO',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'MINUSC',
    MATCH: 'COINCIDIR',
    MAX: 'MAX',
    MAXA: 'MAXA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MEDIANA',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'EXTRAE',
    MIN: 'MIN',
    MINA: 'MINA',
    MINUTE: 'MINUTO',
    MIRR: 'TIRM',
    MMULT: 'MMULT',
    MOD: 'RESIDUO',
    MONTH: 'MES',
    NA: 'NOD',
    NETWORKDAYS: 'DIAS.LAB',
    'NETWORKDAYS.INTL': 'DIAS.LAB.INTL',
    NOMINAL: 'TASA.NOMINAL',
    NOT: 'NO',
    NOW: 'AHORA',
    NPER: 'NPER',
    NPV: 'VNA',
    OCT2BIN: 'OCT.A.BIN',
    OCT2DEC: 'OCT.A.DEC',
    OCT2HEX: 'OCT.A.HEX',
    ODD: 'REDONDEA.IMPAR',
    OFFSET: 'DESREF',
    OR: 'O',
    PDURATION: 'PDURATION',
    PI: 'PI',
    PMT: 'PAGO',
    PRODUCT: 'PRODUCTO',
    POWER: 'POTENCIA',
    PPMT: 'PAGOPRIN',
    PROPER: 'NOMPROPIO',
    PV: 'VA',
    RADIANS: 'RADIANES',
    RAND: 'ALEATORIO',
    RATE: 'TASA',
    REPLACE: 'REEMPLAZAR',
    REPT: 'REPETIR',
    RIGHT: 'DERECHA',
    ROUND: 'REDONDEAR',
    ROUNDDOWN: 'REDONDEAR.MENOS',
    ROUNDUP: 'REDONDEAR.MAS',
    ROW: 'FILA',
    ROWS: 'FILAS',
    RRI: 'RRI',
    SEARCH: 'HALLAR',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEGUNDO',
    SHEET: 'HOJA',
    SHEETS: 'HOJAS',
    SIN: 'SENO',
    SINH: 'SENOH',
    SLN: 'SLN',
    SPLIT: 'SPLIT',
    SQRT: 'RAIZ',
    STDEVA: 'DESVESTA',
    'STDEV.P': 'DESVEST.P',
    STDEVPA: 'DESVESTPA',
    'STDEV.S': 'DESVEST.M',
    SUBSTITUTE: 'SUSTITUIR',
    SUBTOTAL: 'SUBTOTALES',
    SUM: 'SUMA',
    SUMIF: 'SUMAR.SI',
    SUMIFS: 'SUMAR.SI.CONJUNTO',
    SUMPRODUCT: 'SUMAPRODUCTO',
    SUMSQ: 'SUMA.CUADRADOS',
    SWITCH: '',
    SYD: 'SYD',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'LETRA.DE.TEST.EQV.A.BONO',
    TBILLPRICE: 'LETRA.DE.TES.PRECIO',
    TBILLYIELD: 'LETRA.DE.TES.RENDTO',
    TEXT: 'TEXTO',
    TIME: 'NSHORA',
    TIMEVALUE: 'HORANUMERO',
    TODAY: 'HOY',
    TRANSPOSE: 'TRANSPONER',
    TRIM: 'ESPACIOS',
    TRUE: 'VERDADERO',
    TRUNC: 'TRUNCAR',
    UNICHAR: 'UNICHAR',
    UNICODE: 'UNICODE',
    UPPER: 'MAYUSC',
    VARA: 'VARA',
    'VAR.P': 'VAR.P',
    VARPA: 'VARPA',
    'VAR.S': 'VAR.S',
    VLOOKUP: 'BUSCARV',
    WEEKDAY: 'DIASEM',
    WEEKNUM: 'NUM.DE.SEMANA',
    WORKDAY: 'DIA.LAB',
    'WORKDAY.INTL': 'DIA.LAB.INTL',
    XNPV: 'VNA.NO.PER',
    XOR: 'XOR',
    YEAR: 'AÑO',
    YEARFRAC: 'FRAC.AÑO',
    ROMAN: 'NUMERO.ROMANO',
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
    VAR: 'VAR',
    VARP: 'VARP',
    STDEV: 'DESVEST',
    STDEVP: 'DESVESTP',
    FACT: 'FACT',
    FACTDOUBLE: 'FACT.DOBLE',
    COMBIN: 'COMBINAT',
    COMBINA: 'COMBINA',
    GCD: 'M.C.D',
    LCM: 'M.C.M',
    MROUND: 'REDOND.MULT',
    MULTINOMIAL: 'MULTINOMIAL',
    QUOTIENT: 'COCIENTE',
    RANDBETWEEN: 'ALEATORIO.ENTRE',
    SERIESSUM: 'SUMA.SERIES',
    SIGN: 'SIGNO',
    SQRTPI: 'RAIZ2PI',
    SUMX2MY2: 'SUMAX2MENOSY2',
    SUMX2PY2: 'SUMAX2MASY2',
    SUMXMY2: 'SUMAXMENOSY2',
    'EXPON.DIST': 'DISTR.EXP.N',
    EXPONDIST: 'DISTR.EXP',
    FISHER: 'FISHER',
    FISHERINV: 'PRUEBA.FISHER.INV',
    GAMMA: 'GAMMA',
    'GAMMA.DIST': 'DISTR.GAMMA.N',
    'GAMMA.INV': 'INV.GAMMA',
    GAMMADIST: 'DISTR.GAMMA',
    GAMMAINV: 'DISTR.GAMMA.INV',
    GAMMALN: 'GAMMA.LN',
    'GAMMALN.PRECISE': 'GAMMA.LN.EXACTO',
    GAUSS: 'GAUSS',
    'BETA.DIST': 'DISTR.BETA.N',
    BETADIST: 'DISTR.BETA',
    'BETA.INV': 'INV.BETA.N',
    BETAINV: 'DISTR.BETA.INV',
    'BINOM.DIST': 'DISTR.BINOM.N',
    BINOMDIST: 'DISTR.BINOM',
    'BINOM.INV': 'INV.BINOM',
    BESSELI: 'BESSELI',
    BESSELJ: 'BESSELJ',
    BESSELK: 'BESSELK',
    BESSELY: 'BESSELY',
    CHIDIST: 'DISTR.CHI',
    CHIINV: 'PRUEBA.CHI.INV',
    'CHISQ.DIST': 'DISTR.CHICUAD',
    'CHISQ.DIST.RT': 'DISTR.CHICUAD.CD',
    'CHISQ.INV': 'INV.CHICUAD',
    'CHISQ.INV.RT': 'INV.CHICUAD.CD',
    'F.DIST': 'DISTR.F.N',
    'F.DIST.RT': 'DISTR.F.CD',
    'F.INV': 'INV.F',
    'F.INV.RT': 'INV.F.CD',
    FDIST: 'DISTR.F',
    FINV: 'DISTR.F.INV',
    WEIBULL: 'DIST.WEIBULL',
    'WEIBULL.DIST': 'DISTR.WEIBULL',
    POISSON: 'POISSON',
    'POISSON.DIST': 'POISSON.DIST',
    'HYPGEOM.DIST': 'DISTR.HIPERGEOM.N',
    HYPGEOMDIST: 'DISTR.HIPERGEOM',
    'T.DIST': 'DISTR.T.N',
    'T.DIST.2T': 'DISTR.T.2C',
    'T.DIST.RT': 'DISTR.T.CD',
    'T.INV': 'INV.T',
    'T.INV.2T': 'INV.T.2C',
    TDIST: 'DISTR.T',
    TINV: 'DISTR.T.INV',
    LOGINV: 'DISTR.LOG.INV',
    'LOGNORM.DIST': 'DISTR.LOGNORM',
    'LOGNORM.INV': 'INV.LOGNORM',
    LOGNORMDIST: 'DISTR.LOG.NORM',
    'NORM.DIST': 'DISTR.NORM.N',
    'NORM.INV': 'INV.NORM',
    'NORM.S.DIST': 'DISTR.NORM.ESTAND.N',
    'NORM.S.INV': 'INV.NORM.ESTAND',
    NORMDIST: 'DISTR.NORM',
    NORMINV: 'DISTR.NORM.INV',
    NORMSDIST: 'DISTR.NORM.ESTAND',
    NORMSINV: 'DISTR.NORM.ESTAND.INV',
    PHI: 'PHI',
    'NEGBINOM.DIST': 'NEGBINOM.DIST',
    NEGBINOMDIST: 'NEGBINOMDIST',
    COMPLEX: 'COMPLEJO',
  },
  langCode: 'esES',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
