# Correctness/performance testing by comparing HF results with other software

Test the calculation results and speed of HyperFormula against Microsoft Excel and Google Sheets.

## Rough plan

- Acquire/produce a set of sheets (CSV format?).
- Produce tooling required for running HF across them.
- Compare the results with popular spreadsheet software (Excel, Google Sheets).
- Automate the process and run it periodically.

## Importing XLSX files into HF

- description: docs/guide/file-import.md
- code: https://github.com/handsontable/hyperformula-demos/blob/3.0.x/read-excel-file/read-excel-file.js

## XLSX files for testing

- we should start with a simple example with one formula
- then, we can use example sheets from my local disc and from https://handsoncode.atlassian.net/wiki/spaces/PH/pages/6128720/May+10+2023+Feedback+about+HyperFormula+from+Continuous+Software
- finally, we will try to find/produce more real-world complex test cases
