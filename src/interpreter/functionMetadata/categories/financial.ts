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
    parameters: [{name: 'rate', description: ''}, {name: 'nper', description: ''}, {name: 'pv', description: ''}, {name: 'start', description: ''}, {name: 'end', description: ''}, {name: 'type', description: ''}],
  },
  CUMPRINC: {
    category: 'Financial',
    shortDescription: 'Returns the cumulative principal paid on a loan between a start period and an end period.',
    parameters: [{name: 'rate', description: ''}, {name: 'nper', description: ''}, {name: 'pv', description: ''}, {name: 'start', description: ''}, {name: 'end', description: ''}, {name: 'type', description: ''}],
  },
  DB: {
    category: 'Financial',
    shortDescription: 'Returns the depreciation of an asset for a period using the fixed-declining balance method.',
    parameters: [{name: 'cost', description: ''}, {name: 'salvage', description: ''}, {name: 'life', description: ''}, {name: 'period', description: ''}, {name: 'month', description: ''}],
  },
  DDB: {
    category: 'Financial',
    shortDescription: 'Returns the depreciation of an asset for a period using the double-declining balance method.',
    parameters: [{name: 'cost', description: ''}, {name: 'salvage', description: ''}, {name: 'life', description: ''}, {name: 'period', description: ''}, {name: 'factor', description: ''}],
  },
  DOLLARDE: {
    category: 'Financial',
    shortDescription: 'Converts a price entered with a special notation to a price displayed as a decimal number.',
    parameters: [{name: 'price', description: ''}, {name: 'fraction', description: ''}],
  },
  DOLLARFR: {
    category: 'Financial',
    shortDescription: 'Converts a price displayed as a decimal number to a price entered with a special notation.',
    parameters: [{name: 'price', description: ''}, {name: 'fraction', description: ''}],
  },
  EFFECT: {
    category: 'Financial',
    shortDescription: 'Calculates the effective annual interest rate from a nominal interest rate and the number of compounding periods per year.',
    parameters: [{name: 'nominal_rate', description: ''}, {name: 'npery', description: ''}],
  },
  FV: {
    category: 'Financial',
    shortDescription: 'Returns the future value of an investment.',
    parameters: [{name: 'rate', description: ''}, {name: 'nper', description: ''}, {name: 'pmt', description: ''}, {name: 'pv', description: ''}, {name: 'type', description: ''}],
  },
  FVSCHEDULE: {
    category: 'Financial',
    shortDescription: 'Returns the future value of an investment based on a rate schedule.',
    parameters: [{name: 'pv', description: ''}, {name: 'schedule', description: ''}],
  },
  IPMT: {
    category: 'Financial',
    shortDescription: 'Returns the interest portion of a given loan payment in a given payment period.',
    parameters: [{name: 'rate', description: ''}, {name: 'per', description: ''}, {name: 'nper', description: ''}, {name: 'pv', description: ''}, {name: 'fv', description: ''}, {name: 'type', description: ''}],
  },
  IRR: {
    category: 'Financial',
    shortDescription: 'Returns the internal rate of return for a series of cash flows.',
    parameters: [{name: 'values', description: ''}, {name: 'guess', description: ''}],
  },
  ISPMT: {
    category: 'Financial',
    shortDescription: 'Returns the interest paid for a given period of an investment with equal principal payments.',
    parameters: [{name: 'rate', description: ''}, {name: 'per', description: ''}, {name: 'nper', description: ''}, {name: 'value', description: ''}],
  },
  MIRR: {
    category: 'Financial',
    shortDescription: 'Returns modified internal value for cashflows.',
    parameters: [{name: 'flows', description: ''}, {name: 'f_rate', description: ''}, {name: 'r_rate', description: ''}],
  },
  NOMINAL: {
    category: 'Financial',
    shortDescription: 'Returns the nominal interest rate.',
    parameters: [{name: 'effect_rate', description: ''}, {name: 'npery', description: ''}],
  },
  NPER: {
    category: 'Financial',
    shortDescription: 'Returns the number of periods for an investment assuming periodic, constant payments and a constant interest rate.',
    parameters: [{name: 'rate', description: ''}, {name: 'pmt', description: ''}, {name: 'pv', description: ''}, {name: 'fv', description: ''}, {name: 'type', description: ''}],
  },
  NPV: {
    category: 'Financial',
    shortDescription: 'Returns net present value.',
    parameters: [{name: 'rate', description: ''}, {name: 'value1', description: ''}],
  },
  PDURATION: {
    category: 'Financial',
    shortDescription: 'Returns number of periods to reach specific value.',
    parameters: [{name: 'rate', description: ''}, {name: 'pv', description: ''}, {name: 'fv', description: ''}],
  },
  PMT: {
    category: 'Financial',
    shortDescription: 'Returns the periodic payment for a loan.',
    parameters: [{name: 'rate', description: ''}, {name: 'nper', description: ''}, {name: 'pv', description: ''}, {name: 'fv', description: ''}, {name: 'type', description: ''}],
  },
  PPMT: {
    category: 'Financial',
    shortDescription: 'Calculates the principal portion of a given loan payment.',
    parameters: [{name: 'rate', description: ''}, {name: 'per', description: ''}, {name: 'nper', description: ''}, {name: 'pv', description: ''}, {name: 'fv', description: ''}, {name: 'type', description: ''}],
  },
  PV: {
    category: 'Financial',
    shortDescription: 'Returns the present value of an investment.',
    parameters: [{name: 'rate', description: ''}, {name: 'nper', description: ''}, {name: 'pmt', description: ''}, {name: 'fv', description: ''}, {name: 'type', description: ''}],
  },
  RATE: {
    category: 'Financial',
    shortDescription: 'Returns the interest rate per period of an annuity.',
    parameters: [{name: 'nper', description: ''}, {name: 'pmt', description: ''}, {name: 'pv', description: ''}, {name: 'fv', description: ''}, {name: 'type', description: ''}, {name: 'guess', description: ''}],
  },
  RRI: {
    category: 'Financial',
    shortDescription: 'Returns an equivalent interest rate for the growth of an investment.',
    parameters: [{name: 'nper', description: ''}, {name: 'pv', description: ''}, {name: 'fv', description: ''}],
  },
  SLN: {
    category: 'Financial',
    shortDescription: 'Returns the depreciation of an asset for one period, based on a straight-line method.',
    parameters: [{name: 'cost', description: ''}, {name: 'salvage', description: ''}, {name: 'life', description: ''}],
  },
  SYD: {
    category: 'Financial',
    shortDescription: 'Returns the "sum-of-years" depreciation for an asset in a period.',
    parameters: [{name: 'cost', description: ''}, {name: 'salvage', description: ''}, {name: 'life', description: ''}, {name: 'period', description: ''}],
  },
  TBILLEQ: {
    category: 'Financial',
    shortDescription: 'Returns the bond-equivalent yield for a Treasury bill.',
    parameters: [{name: 'settlement', description: ''}, {name: 'maturity', description: ''}, {name: 'discount', description: ''}],
  },
  TBILLPRICE: {
    category: 'Financial',
    shortDescription: 'Returns the price per $100 face value for a Treasury bill.',
    parameters: [{name: 'settlement', description: ''}, {name: 'maturity', description: ''}, {name: 'discount', description: ''}],
  },
  TBILLYIELD: {
    category: 'Financial',
    shortDescription: 'Returns the yield for a Treasury bill.',
    parameters: [{name: 'settlement', description: ''}, {name: 'maturity', description: ''}, {name: 'price', description: ''}],
  },
  XNPV: {
    category: 'Financial',
    shortDescription: 'Returns net present value.',
    parameters: [{name: 'rate', description: ''}, {name: 'payments', description: ''}, {name: 'dates', description: ''}],
  },
  XIRR: {
    category: 'Financial',
    shortDescription: 'Returns the internal rate of return for a schedule of cash flows that is not necessarily periodic.',
    parameters: [{name: 'values', description: ''}, {name: 'dates', description: ''}, {name: 'guess', description: ''}],
  },
}
