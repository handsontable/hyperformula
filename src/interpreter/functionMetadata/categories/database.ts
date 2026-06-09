/**
 * @license
 * Copyright (c) 2025 Handsoncode. All rights reserved.
 */

import {FunctionDoc} from '../FunctionDescription'

/**
 * Catalogue entries for the "Database" category. Generated from `docs/guide/built-in-functions.md` by
 * `scripts/hf249-migrate-function-docs.ts`; parameter descriptions are authored in a later phase.
 */
export const DATABASE_DOCS: Record<string, FunctionDoc> = {
  DAVERAGE: {
    category: 'Database',
    shortDescription: 'Returns the average of all values in a database field that match the given criteria.',
    parameters: [{name: 'Database', description: ''}, {name: 'Field', description: ''}, {name: 'Criteria', description: ''}],
  },
  DCOUNT: {
    category: 'Database',
    shortDescription: 'Counts the cells containing numbers in a database field that match the given criteria.',
    parameters: [{name: 'Database', description: ''}, {name: 'Field', description: ''}, {name: 'Criteria', description: ''}],
  },
  DCOUNTA: {
    category: 'Database',
    shortDescription: 'Counts the non-empty cells in a database field that match the given criteria.',
    parameters: [{name: 'Database', description: ''}, {name: 'Field', description: ''}, {name: 'Criteria', description: ''}],
  },
  DGET: {
    category: 'Database',
    shortDescription: 'Returns the single value from a database field that matches the given criteria. Returns #VALUE! if no records match, and #NUM! if more than one record matches.',
    parameters: [{name: 'Database', description: ''}, {name: 'Field', description: ''}, {name: 'Criteria', description: ''}],
  },
  DMAX: {
    category: 'Database',
    shortDescription: 'Returns the maximum value in a database field that matches the given criteria.',
    parameters: [{name: 'Database', description: ''}, {name: 'Field', description: ''}, {name: 'Criteria', description: ''}],
  },
  DMIN: {
    category: 'Database',
    shortDescription: 'Returns the minimum value in a database field that matches the given criteria.',
    parameters: [{name: 'Database', description: ''}, {name: 'Field', description: ''}, {name: 'Criteria', description: ''}],
  },
  DPRODUCT: {
    category: 'Database',
    shortDescription: 'Returns the product of all values in a database field that match the given criteria.',
    parameters: [{name: 'Database', description: ''}, {name: 'Field', description: ''}, {name: 'Criteria', description: ''}],
  },
  DSTDEV: {
    category: 'Database',
    shortDescription: 'Returns the sample standard deviation of all values in a database field that match the given criteria.',
    parameters: [{name: 'Database', description: ''}, {name: 'Field', description: ''}, {name: 'Criteria', description: ''}],
  },
  DSTDEVP: {
    category: 'Database',
    shortDescription: 'Returns the population standard deviation of all values in a database field that match the given criteria.',
    parameters: [{name: 'Database', description: ''}, {name: 'Field', description: ''}, {name: 'Criteria', description: ''}],
  },
  DSUM: {
    category: 'Database',
    shortDescription: 'Returns the sum of all values in a database field that match the given criteria.',
    parameters: [{name: 'Database', description: ''}, {name: 'Field', description: ''}, {name: 'Criteria', description: ''}],
  },
  DVAR: {
    category: 'Database',
    shortDescription: 'Returns the sample variance of all values in a database field that match the given criteria.',
    parameters: [{name: 'Database', description: ''}, {name: 'Field', description: ''}, {name: 'Criteria', description: ''}],
  },
  DVARP: {
    category: 'Database',
    shortDescription: 'Returns the population variance of all values in a database field that match the given criteria.',
    parameters: [{name: 'Database', description: ''}, {name: 'Field', description: ''}, {name: 'Criteria', description: ''}],
  },
}
