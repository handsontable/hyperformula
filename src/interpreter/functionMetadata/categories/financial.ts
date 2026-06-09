/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Financial" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`; parameter descriptions are authored in a later phase.
 */
export const FINANCIAL_DOCS: Record<string, FunctionDoc> = {
  CUMIPMT: {
    category: 'Financial',
    shortDescription: 'Returns the cumulative interest paid on a loan between a start period and an end period.',
    parameters: [{name: 'Rate', description: ''}, {name: 'Nper', description: ''}, {name: 'Pv', description: ''}, {name: 'Start', description: ''}, {name: 'End', description: ''}, {name: 'type', description: ''}],
  },
  CUMPRINC: {
    category: 'Financial',
    shortDescription: 'Returns the cumulative principal paid on a loan between a start period and an end period.',
    parameters: [{name: 'Rate', description: ''}, {name: 'Nper', description: ''}, {name: 'Pv', description: ''}, {name: 'Start', description: ''}, {name: 'End', description: ''}, {name: 'Type', description: ''}],
  },
  DB: {
    category: 'Financial',
    shortDescription: 'Returns the depreciation of an asset for a period using the fixed-declining balance method.',
    parameters: [{name: 'Cost', description: ''}, {name: 'Salvage', description: ''}, {name: 'Life', description: ''}, {name: 'Period', description: ''}, {name: 'Month', description: ''}],
  },
  DDB: {
    category: 'Financial',
    shortDescription: 'Returns the depreciation of an asset for a period using the double-declining balance method.',
    parameters: [{name: 'Cost', description: ''}, {name: 'Salvage', description: ''}, {name: 'Life', description: ''}, {name: 'Period', description: ''}, {name: 'Factor', description: ''}],
  },
  DOLLARDE: {
    category: 'Financial',
    shortDescription: 'Converts a price entered with a special notation to a price displayed as a decimal number.',
    parameters: [{name: 'Price', description: ''}, {name: 'Fraction', description: ''}],
  },
  DOLLARFR: {
    category: 'Financial',
    shortDescription: 'Converts a price displayed as a decimal number to a price entered with a special notation.',
    parameters: [{name: 'Price', description: ''}, {name: 'Fraction', description: ''}],
  },
  EFFECT: {
    category: 'Financial',
    shortDescription: 'Calculates the effective annual interest rate from a nominal interest rate and the number of compounding periods per year.',
    parameters: [{name: 'Nominal_rate', description: ''}, {name: 'Npery', description: ''}],
  },
  FV: {
    category: 'Financial',
    shortDescription: 'Returns the future value of an investment.',
    parameters: [{name: 'Rate', description: ''}, {name: 'Nper', description: ''}, {name: 'Pmt', description: ''}, {name: 'Pv', description: ''}, {name: 'Type', description: ''}],
  },
  FVSCHEDULE: {
    category: 'Financial',
    shortDescription: 'Returns the future value of an investment based on a rate schedule.',
    parameters: [{name: 'Pv', description: ''}, {name: 'Schedule', description: ''}],
  },
  IPMT: {
    category: 'Financial',
    shortDescription: 'Returns the interest portion of a given loan payment in a given payment period.',
    parameters: [{name: 'Rate', description: ''}, {name: 'Per', description: ''}, {name: 'Nper', description: ''}, {name: 'Pv', description: ''}, {name: 'Fv', description: ''}, {name: 'Type', description: ''}],
  },
  IRR: {
    category: 'Financial',
    shortDescription: 'Returns the internal rate of return for a series of cash flows.',
    parameters: [{name: 'Values', description: ''}, {name: 'Guess', description: ''}],
  },
  ISPMT: {
    category: 'Financial',
    shortDescription: 'Returns the interest paid for a given period of an investment with equal principal payments.',
    parameters: [{name: 'Rate', description: ''}, {name: 'Per', description: ''}, {name: 'Nper', description: ''}, {name: 'Value', description: ''}],
  },
  MIRR: {
    category: 'Financial',
    shortDescription: 'Returns modified internal value for cashflows.',
    parameters: [{name: 'Flows', description: ''}, {name: 'FRate', description: ''}, {name: 'RRate', description: ''}],
  },
  NOMINAL: {
    category: 'Financial',
    shortDescription: 'Returns the nominal interest rate.',
    parameters: [{name: 'Effect_rate', description: ''}, {name: 'Npery', description: ''}],
  },
  NPER: {
    category: 'Financial',
    shortDescription: 'Returns the number of periods for an investment assuming periodic, constant payments and a constant interest rate.',
    parameters: [{name: 'Rate', description: ''}, {name: 'Pmt', description: ''}, {name: 'Pv', description: ''}, {name: 'Fv', description: ''}, {name: 'Type', description: ''}],
  },
  NPV: {
    category: 'Financial',
    shortDescription: 'Returns net present value.',
    parameters: [{name: 'Rate', description: ''}, {name: 'Value1', description: ''}],
  },
  PDURATION: {
    category: 'Financial',
    shortDescription: 'Returns number of periods to reach specific value.',
    parameters: [{name: 'Rate', description: ''}, {name: 'Pv', description: ''}, {name: 'Fv', description: ''}],
  },
  PMT: {
    category: 'Financial',
    shortDescription: 'Returns the periodic payment for a loan.',
    parameters: [{name: 'Rate', description: ''}, {name: 'Nper', description: ''}, {name: 'Pv', description: ''}, {name: 'Fv', description: ''}, {name: 'Type', description: ''}],
  },
  PPMT: {
    category: 'Financial',
    shortDescription: 'Calculates the principal portion of a given loan payment.',
    parameters: [{name: 'Rate', description: ''}, {name: 'Per', description: ''}, {name: 'Nper', description: ''}, {name: 'Pv', description: ''}, {name: 'Fv', description: ''}, {name: 'Type', description: ''}],
  },
  PV: {
    category: 'Financial',
    shortDescription: 'Returns the present value of an investment.',
    parameters: [{name: 'Rate', description: ''}, {name: 'Nper', description: ''}, {name: 'Pmt', description: ''}, {name: 'Fv', description: ''}, {name: 'Type', description: ''}],
  },
  RATE: {
    category: 'Financial',
    shortDescription: 'Returns the interest rate per period of an annuity.',
    parameters: [{name: 'Nper', description: ''}, {name: 'Pmt', description: ''}, {name: 'Pv', description: ''}, {name: 'Fv', description: ''}, {name: 'Type', description: ''}, {name: 'guess', description: ''}],
  },
  RRI: {
    category: 'Financial',
    shortDescription: 'Returns an equivalent interest rate for the growth of an investment.',
    parameters: [{name: 'Nper', description: ''}, {name: 'Pv', description: ''}, {name: 'Fv', description: ''}],
  },
  SLN: {
    category: 'Financial',
    shortDescription: 'Returns the depreciation of an asset for one period, based on a straight-line method.',
    parameters: [{name: 'Cost', description: ''}, {name: 'Salvage', description: ''}, {name: 'Life', description: ''}],
  },
  SYD: {
    category: 'Financial',
    shortDescription: 'Returns the "sum-of-years" depreciation for an asset in a period.',
    parameters: [{name: 'Cost', description: ''}, {name: 'Salvage', description: ''}, {name: 'Life', description: ''}, {name: 'Period', description: ''}],
  },
  TBILLEQ: {
    category: 'Financial',
    shortDescription: 'Returns the bond-equivalent yield for a Treasury bill.',
    parameters: [{name: 'Settlement', description: ''}, {name: 'Maturity', description: ''}, {name: 'Discount', description: ''}],
  },
  TBILLPRICE: {
    category: 'Financial',
    shortDescription: 'Returns the price per $100 face value for a Treasury bill.',
    parameters: [{name: 'Settlement', description: ''}, {name: 'Maturity', description: ''}, {name: 'Discount', description: ''}],
  },
  TBILLYIELD: {
    category: 'Financial',
    shortDescription: 'Returns the yield for a Treasury bill.',
    parameters: [{name: 'Settlement', description: ''}, {name: 'Maturity', description: ''}, {name: 'Price', description: ''}],
  },
  XNPV: {
    category: 'Financial',
    shortDescription: 'Returns net present value.',
    parameters: [{name: 'Rate', description: ''}, {name: 'Payments', description: ''}, {name: 'Dates', description: ''}],
  },
}
