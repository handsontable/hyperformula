# Compatibility Testing

This directory contains tools for testing HyperFormula's compatibility with Excel by comparing evaluation results.

## Overview

The compatibility test suite reads Excel (.xlsx) files, evaluates their formulas using HyperFormula, and compares the results against Excel's calculated values to detect discrepancies.

## Structure

- **`test-compatibility.sh`** - Main test runner that processes all Excel files in `test_data/`
- **`compare-evaluation-results.ts`** - Core comparison tool that:
  - Extracts formulas and values from Excel files
  - Evaluates formulas using HyperFormula
  - Compares results (formulas and values)
  - Reports differences with tolerance for floating-point precision
- **`test_data/`** - Collection of Excel test files covering various features

## Usage

Run all compatibility tests:
```bash
bash test/compatibility/test-compatibility.sh
```

Test a specific Excel file:
```bash
ts-node --transpile-only -O '{"module":"commonjs"}' test/compatibility/compare-evaluation-results.ts test/compatibility/test_data/your-file.xlsx
```

## Exit Codes

- **0** - All tests passed (no differences found)
- **1** - Differences detected or error occurred

## How It Works

1. Reads Excel workbook and extracts formulas and pre-calculated values
2. Evaluates formulas using HyperFormula with Excel-compatible configuration
3. Compares:
   - **Formulas**: HyperFormula's serialized formulas vs. original Excel formulas
   - **Values**: HyperFormula's computed values vs. Excel's values
4. Uses configurable epsilon (10⁻⁹) for floating-point comparisons
5. Normalizes null-like values (0, '', false, null, undefined) for consistent comparison

## Adding Test Cases

Add `.xlsx` files to `test_data/`. Files starting with `~` are automatically skipped (Excel lock files).
