# Compatibility Testing

This directory contains tools for testing HyperFormula's compatibility with Excel by comparing evaluation results.

## Overview

This compatibiloty testing tool performs the following steps for each .xlsx in `test_data/` directory:
1. read both formulas and calculated values from the XLSX file
2. evaluate the formulas using HyperFormula
3. compare the HyperFormula's results against the original values
4. report differences

## Structure

- **`test-compatibility.sh`** - Main test runner that processes all Excel files in `test_data/`
- **`compare-evaluation-results.ts`** - Core comparison tool
- **`test_data/`** - Collection of Excel test files covering various features

## Running

Run all compatibility tests:
```bash
npm run test:compatibility
```

Test a specific Excel file:
```bash
ts-node --transpile-only -O '{"module":"commonjs"}' test/compatibility/compare-evaluation-results.ts test/compatibility/test_data/your-file.xlsx
```

## Adding Test Cases

1. Create the XLSX file with both formulas and calculated values using MS Excel or Google Sheets
2. Put the file into `test_data/` directory
