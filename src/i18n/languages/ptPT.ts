/**
 * @license
 * Copyright (c) 2020 Handsoncode. All rights reserved.
 */

import {RawTranslationPackage} from '..'
// import

const dictionary: RawTranslationPackage = {
  errors: {
    CYCLE: '#CYCLE!',
    DIV_BY_ZERO: '#DIV/0!',
    ERROR: '#ERROR!',
    NA: '#N/D',
    NAME: '#NOME?',
    NUM: '#NÚM!',
    REF: '#REF!',
    VALUE: '#VALOR!',
  },
  functions: {
    ABS: 'ABS',
    ACOS: 'ACOS',
    ACOSH: 'ACOSH',
    ACOT: 'ACOT',
    ACOTH: 'ACOTH',
    AND: 'E',
    ASIN: 'ASEN',
    ASINH: 'ASENH',
    ATAN2: 'ATAN2',
    ATAN: 'ATAN',
    ATANH: 'ATANH',
    AVERAGE: 'MÉDIA',
    AVERAGEA: 'MÉDIAA',
    AVERAGEIF: 'MÉDIASE',
    BASE: 'BASE',
    BIN2DEC: 'BINADEC',
    BIN2HEX: 'BINAHEX',
    BIN2OCT: 'BINAOCT',
    BITAND: 'ELÓGICO',
    BITLSHIFT: 'DESLOCESQBIT',
    BITOR: 'OULÓGICO',
    BITRSHIFT: 'DESLOCDIRBIT',
    BITXOR: 'OUEXCLLÓGICO',
    CEILING: 'TETO',
    CHAR: 'CARACT',
    CHOOSE: 'ESCOLHER',
    CLEAN: 'TIRAR',
    CODE: 'CÓDIGO',
    COLUMN: 'COL',
    COLUMNS: 'COLS',
    CONCATENATE: 'CONCATENAR',
    CORREL: 'CORREL',
    COS: 'COS',
    COSH: 'COSH',
    COT: 'COT',
    COTH: 'COTH',
    COUNT: 'CONT.NÚM',
    COUNTA: 'CONT.VALORES',
    COUNTBLANK: 'CONTAR.VAZIO',
    COUNTIF: 'CONT.SE',
    COUNTIFS: 'CONT.SES',
    COUNTUNIQUE: 'COUNTUNIQUE',
    CSC: 'COSEC',
    CSCH: 'COSECH',
    CUMIPMT: 'PGTOJURACUM',
    CUMPRINC: 'PGTOCAPACUM',
    DATE: 'DATA',
    DATEDIF: 'DATEDIF', //FIXME
    DATEVALUE: 'DATA.VALOR',
    DAY: 'DIA',
    DAYS360: 'DIAS360',
    DAYS: 'DIAS',
    DB: 'BD',
    DDB: 'BDD',
    DEC2BIN: 'DECABIN',
    DEC2HEX: 'DECAHEX',
    DEC2OCT: 'DECAOCT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'GRAUS',
    DELTA: 'DELTA',
    DOLLARDE: 'MOEDADEC',
    DOLLARFR: 'MOEDAFRA',
    EDATE: 'DATAM',
    EFFECT: "EFETIVA",
    EOMONTH: 'FIMMÊS',
    ERF: 'FUNERRO',
    ERFC: 'FUNERROCOMPL',
    EVEN: 'PAR',
    EXACT: 'EXATO',
    EXP: 'EXP',
    FALSE: 'FALSO',
    FIND: 'PROCURAR',
    FORMULATEXT: 'FÓRMULA.TEXTO',
    FV: 'VF',
    HEX2BIN: 'HEXABIN',
    HEX2DEC: 'HEXADEC',
    HEX2OCT: 'HEXAOCT',
    HLOOKUP: 'PROCH',
    HOUR: 'HORA',
    IF: 'SE',
    IFERROR: 'SEERRO',
    IFNA: 'SENA',
    INDEX: 'ÍNDICE',
    INT: 'INT',
    IPMT: 'IPGTO',
    ISBINARY: 'ISBINARY',
    ISBLANK: 'ÉCÉL.VAZIA',
    ISERR: 'ÉERRO',
    ISERROR: 'ÉERROS',
    ISEVEN: 'ÉPAR',
    ISFORMULA: 'ÉFÓRMULA',
    ISLOGICAL: 'ÉLÓGICO',
    ISNA: 'É.NÃO.DISP',
    ISNONTEXT: 'É.NÃO.TEXTO',
    ISNUMBER: 'ÉNÚM',
    ISODD: 'ÉIMPAR',
    ISOWEEKNUM: 'NUMSEMISO',
    ISPMT: 'ÉPGTO',
    ISREF: 'ÉREF',
    ISTEXT: 'ÉTEXTO',
    LEFT: 'ESQUERDA',
    LEN: 'NÚM.CARACT',
    LN: 'LN',
    LOG10: 'LOG10',
    LOG: 'LOG',
    LOWER: 'MINÚSCULA',
    MATCH: 'CORRESP',
    MAX: 'MÁXIMO',
    MAXA: 'MÁXIMOA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MED',
    MEDIANPOOL: 'MEDIANPOOL',
    MID: 'EXT.TEXTO',
    MIN: 'MÍNIMO',
    MINA: 'MÍNIMOA',
    MINUTE: 'MINUTO',
    MMULT: 'MATRIZ.MULT',
    MOD: 'MOD',
    MONTH: 'MÊS',
    NA: 'NÃO.DISP',
    NOMINAL: 'NOMINAL',
    NOT: 'NÃO',
    NOW: 'AGORA',
    NPER: 'NPER',
    OCT2BIN: 'OCTABIN',
    OCT2DEC: 'OCTADEC',
    OCT2HEX: 'OCTAHEX',
    ODD: 'ÍMPAR',
    OFFSET: 'DESLOC',
    OR: 'OU',
    PI: 'PI',
    PMT: 'PGTO',
    PRODUCT: 'MULT',
    POWER: 'POTÊNCIA',
    PPMT: 'PPGTO',
    PROPER: 'PRI.MAIÚSCULA',
    PV: 'VP',
    RADIANS: 'RADIANOS',
    RAND: 'ALEATÓRIO',
    RATE: 'TAXA',
    REPLACE: 'MUDAR',
    REPT: 'REPT',
    RIGHT: 'DIREITA',
    ROUND: 'ARRED',
    ROUNDDOWN: 'ARREDONDAR.PARA.BAIXO',
    ROUNDUP: 'ARREDONDAR.PARA.CIMA',
    ROW: 'LIN',
    ROWS: 'LINS',
    RRI: 'RRI',
    SEARCH: 'LOCALIZAR',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEGUNDO',
    SHEET: 'PLANILHA',
    SHEETS: 'PLANILHAS',
    SIN: 'SEN',
    SINH: 'SENH',
    SLN: 'DPD',
    SPLIT: 'SPLIT',
    SQRT: 'RAIZ',
    STDEVA: 'DESVPADA',
    'STDEV.P': 'DESVPAD.P',
    STDEVPA: 'DESVPADPA',
    'STDEV.S': 'DESVPAD.A',
    SUBSTITUTE: 'SUBSTITUIR',
    SUBTOTAL: 'SUBTOTAL',
    SUM: 'SOMA',
    SUMIF: 'SOMASE',
    SUMIFS: 'SOMASES',
    SUMPRODUCT: 'SOMARPRODUTO',
    SUMSQ: 'SOMAQUAD',
    SWITCH: '',
    SYD: 'SDA',
    T: 'T',
    TAN: 'TAN',
    TANH: 'TANH',
    TBILLEQ: 'OTN',
    TBILLPRICE: 'OTNVALOR',
    TBILLYIELD: 'OTNLUCRO',
    TEXT: 'TEXTO',
    TIME: 'TEMPO',
    TIMEVALUE: 'VALOR.TEMPO',
    TODAY: 'HOJE',
    TRANSPOSE: 'TRANSPOR',
    TRIM: 'ARRUMAR',
    TRUE: 'VERDADEIRO',
    TRUNC: 'TRUNCAR',
    UNICHAR: 'CARACTUNI',
    UNICODE: 'UNICODE',
    UPPER: 'MAIÚSCULA',
    'VAR.P': 'VAR.P',
    'VAR.S': 'VAR.A',
    VLOOKUP: 'PROCV',
    WEEKDAY: 'DIA.DA.SEMANA',
    WEEKNUM: 'NÚMSEMANA',
    XOR: 'OUEXCL',
    YEAR: 'ANO',
    YEARFRAC: 'FRAÇÃOANO',
  },
  langCode: 'ptPT',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
