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
    ATAN: 'ATAN',
    ATAN2: 'ATAN2',
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
    DAYS: 'DIAS',
    DB: 'BD',
    DDB: 'BDD',
    DAYS360: 'DIAS360',
    DEC2BIN: 'DECABIN',
    DEC2HEX: 'DECAHEX',
    DEC2OCT: 'DECAOCT',
    DECIMAL: 'DECIMAL',
    DEGREES: 'GRAUS',
    DELTA: 'DELTA',
    DOLLARDE: 'MOEDADEC',
    DOLLARFR: 'MOEDAFRA',
    EFFECT: "EFETIVA",
    EDATE: 'DATAM',
    EOMONTH: 'FIMMÊS',
    ERF: 'FUNERRO',
    ERFC: 'FUNERROCOMPL',
    EVEN: 'PAR',
    EXP: 'EXP',
    FALSE: 'FALSO',
    FIND: 'PROCURAR',
    FORMULATEXT: 'FÓRMULA.TEXTO',
    FV: 'VF',
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
    ISPMT: 'ÉPGTO',
    ISOWEEKNUM: 'NUMSEMISO',
    ISREF: 'ÉREF',
    ISTEXT: 'ÉTEXTO',
    LEFT: 'ESQUERDA',
    LEN: 'NÚM.CARACT',
    LN: 'LN',
    LOG: 'LOG',
    LOG10: 'LOG10',
    MATCH: 'CORRESP',
    MAX: 'MÁXIMO',
    MAXA: 'MÁXIMOA',
    MAXPOOL: 'MAXPOOL',
    MEDIAN: 'MED',
    MEDIANPOOL: 'MEDIANPOOL',
    MIN: 'MÍNIMO',
    MINA: 'MÍNIMOA',
    MINUTE: 'MINUTO',
    MMULT: 'MATRIZ.MULT',
    MOD: 'MOD',
    MONTH: 'MÊS',
    NA: 'NÃO.DISP',
    NOMINAL: 'NOMINAL',
    NOW: 'AGORA',
    NOT: 'NÃO',
    NPER: 'NPER',
    ODD: 'ÍMPAR',
    OFFSET: 'DESLOC',
    OR: 'OU',
    PI: 'PI',
    PMT: 'PGTO',
    POWER: 'POTÊNCIA',
    PPMT: 'PPGTO',
    PROPER: 'PRI.MAIÚSCULA',
    RADIANS: 'RADIANOS',
    RAND: 'ALEATÓRIO',
    RATE: 'TAXA',
    REPT: 'REPT',
    RIGHT: 'DIREITA',
    ROUND: 'ARRED',
    ROUNDDOWN: 'ARREDONDAR.PARA.BAIXO',
    ROUNDUP: 'ARREDONDAR.PARA.CIMA',
    ROWS: 'LINS',
    SEARCH: 'LOCALIZAR',
    SEC: 'SEC',
    SECH: 'SECH',
    SECOND: 'SEGUNDO',
    SHEETS: 'PLANILHAS',
    SHEET: 'PLANILHA',
    SIN: 'SEN',
    SINH: 'SENH',
    SPLIT: 'SPLIT',
    SQRT: 'RAIZ',
    SUM: 'SOMA',
    SUMIF: 'SOMASE',
    SUMIFS: 'SOMASES',
    SUMPRODUCT: 'SOMARPRODUTO',
    SUMSQ: 'SOMAQUAD',
    SWITCH: '',
    TAN: 'TAN',
    TANH: 'TANH',
    TEXT: 'TEXTO',
    TIME: 'TEMPO',
    TIMEVALUE: 'VALOR.TEMPO',
    TODAY: 'HOJE',
    TRANSPOSE: 'TRANSPOR',
    TRIM: 'ARRUMAR',
    TRUE: 'VERDADEIRO',
    TRUNC: 'TRUNCAR',
    VLOOKUP: 'PROCV',
    WEEKDAY: 'DIA.DA.SEMANA',
    WEEKNUM: 'NÚMSEMANA',
    XOR: 'OUEXCL',
    YEAR: 'ANO',
    YEARFRAC: 'FRAÇÃOANO',
    PV: 'VP',
    RRI: 'RRI',
    SLN: 'DPD',
    SYD: 'SDA',
    TBILLEQ: 'OTN',
    TBILLPRICE: 'OTNVALOR',
  },
  langCode: 'ptPT',
  ui: {
    NEW_SHEET_PREFIX: 'Sheet',
  },
}

export default dictionary
