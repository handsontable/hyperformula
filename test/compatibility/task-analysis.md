
# Task analysis

TODOS:
- Set up test data infrastructure with sample XLSX files
- Build HyperFormula testing framework using existing test patterns
- Create Excel/Google Sheets comparison utility
- Implement automated test runner with result comparison
- Set up performance benchmarking infrastructure
- Create comprehensive test suite with real-world scenarios
- Build automated CI pipeline for periodic testing

# Comprehensive Plan for HyperFormula Correctness/Performance Testing

## Phase 1: Test Data Infrastructure

**Keywords:** XLSX parsing, test data management, file import, sample sheets

### 1.1 Sample XLSX File Collection
- Start with simple examples (single formulas like `=SUM(A1:A3)`, `=A1+B1`)
- Use existing CSV samples from `/examples/` as baseline test cases
- Acquire real-world XLSX files from:
  - The mentioned Atlassian wiki feedback collection
  - Local disc examples referenced in task.md
  - Create synthetic complex scenarios covering:
    - Nested functions (`=IF(SUM(A1:A5)>10, MAX(B1:B5), MIN(C1:C5))`)
    - Cross-sheet references
    - Array formulas
    - Date/time calculations
    - Financial functions
    - Statistical functions

### 1.2 Test File Organization
```
/test-data/
├── simple/           # Single formula tests
├── intermediate/     # Multi-formula sheets
├── complex/         # Real-world scenarios
├── edge-cases/      # Error conditions, edge cases
└── performance/     # Large datasets for speed tests
```

## Phase 2: HyperFormula Testing Framework

**Keywords:** buildFromSheets, ExcelJS, test infrastructure, result comparison

### 2.1 XLSX Import Utility
Build on the existing file-import.md example:
```typescript
class HyperFormulaTestRunner {
  async loadXlsxFile(filename: string): Promise<HyperFormula>
  async compareWithExpectedResults(hf: HyperFormula, expectedValues: any[][])
  generateTestReport(results: ComparisonResult[])
}
```

### 2.2 Test Data Structure
```typescript
interface TestCase {
  name: string
  xlsxFile: string
  expectedFormulas: Sheet[]  // What HF should parse
  expectedValues: Sheet[]    // What HF should calculate
  excelValues?: Sheet[]      // Reference from Excel
  gSheetsValues?: Sheet[]    // Reference from Google Sheets
}
```

### 2.3 Integration with Existing Test Framework
- Leverage existing Jest/Jasmine setup from `/test/_setupFiles/`
- Use patterns from existing tests like `engine.spec.ts` and `temporary-formulas.spec.ts`
- Implement custom matchers for formula/value comparison

## Phase 3: Excel/Google Sheets Comparison Utility

**Keywords:** reference implementation, cross-platform testing, result validation

### 3.1 Excel Integration Options
- **Option A:** Use Excel COM automation (Windows only)
- **Option B:** Use Office.js API for web-based Excel
- **Option C:** Manual export/import via CSV for batch testing
- **Recommended:** Start with Option C for simplicity, then enhance

### 3.2 Google Sheets Integration
- Use Google Sheets API v4 for programmatic access
- Batch upload test files and retrieve calculated results
- Handle rate limiting and authentication

### 3.3 Result Comparison Engine
```typescript
interface ComparisonResult {
  cellAddress: string
  hyperformulaValue: CellValue
  excelValue?: CellValue
  gSheetsValue?: CellValue
  match: boolean
  deviation?: number  // For numeric differences
  notes?: string
}
```

## Phase 4: Automated Test Runner

**Keywords:** test automation, result validation, error handling

### 4.1 Test Execution Pipeline
```typescript
class TestSuite {
  async runSingleTest(testCase: TestCase): Promise<TestResult>
  async runBatch(testCases: TestCase[]): Promise<BatchResult>
  async generateReport(results: BatchResult): Promise<void>
}
```

### 4.2 Validation Logic
- **Exact Match:** For strings, booleans, integers
- **Tolerance-based:** For floating-point numbers (configurable epsilon)
- **Error Type Matching:** Compare error types (#DIV/0!, #VALUE!, etc.)
- **Formula Parsing:** Verify HF correctly parses formulas

### 4.3 Reporting System
- HTML dashboard showing pass/fail rates
- Detailed diff views for failed tests
- Performance metrics (calculation time, memory usage)
- Trend analysis over time

## Phase 5: Performance Benchmarking

**Keywords:** performance testing, speed comparison, memory usage, scalability

### 5.1 Benchmark Categories
- **Calculation Speed:** Time to evaluate formulas
- **Memory Usage:** RAM consumption for large sheets
- **Scalability:** Performance with increasing data size
- **Load Time:** Sheet parsing and initialization

### 5.2 Performance Test Framework
```typescript
interface PerformanceTest {
  name: string
  dataSize: { rows: number, cols: number }
  formulaComplexity: 'simple' | 'medium' | 'complex'
  iterations: number
}
```

### 5.3 Baseline Establishment
- Use existing `/test/performance/` infrastructure
- Compare against Excel calculation times (where possible)
- Track performance regression over HyperFormula versions

## Phase 6: Comprehensive Test Suite

**Keywords:** test coverage, real-world scenarios, function validation

### 6.1 Function Coverage Matrix
Test all ~400 built-in functions systematically:
- Mathematical functions (SUM, AVERAGE, etc.)
- Logical functions (IF, AND, OR, etc.)
- Text functions (CONCATENATE, TRIM, etc.)
- Date/time functions (TODAY, DATEVALUE, etc.)
- Lookup functions (VLOOKUP, INDEX, MATCH, etc.)

### 6.2 Edge Case Testing
- Circular references
- Very large numbers/precision limits
- Empty cells and null values
- Invalid formulas and error propagation
- Cross-sheet dependencies

### 6.3 Compatibility Testing
- Excel format compatibility
- Google Sheets format compatibility
- Locale-specific behaviors (date formats, decimal separators)

## Phase 7: CI/CD Integration

**Keywords:** continuous integration, automated testing, regression detection

### 7.1 Automated Pipeline
```yaml
# GitHub Actions or similar
name: HyperFormula Compatibility Tests
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  push:
    branches: [main, develop]

jobs:
  compatibility-test:
    runs-on: ubuntu-latest
    steps:
      - name: Run Excel Comparison Tests
      - name: Run Google Sheets Comparison Tests
      - name: Performance Benchmarks
      - name: Generate Reports
      - name: Notify on Regressions
```

### 7.2 Regression Detection
- Compare results against previous runs
- Alert on performance degradation >5%
- Track accuracy improvements/regressions
- Version-based result archiving

## Implementation Timeline

1. **Week 1-2:** Set up basic XLSX import and simple test cases
2. **Week 3-4:** Build comparison framework with Excel/Google Sheets
3. **Week 5-6:** Implement automated test runner and reporting
4. **Week 7-8:** Add performance benchmarking capabilities
5. **Week 9-10:** Expand test coverage with real-world scenarios
6. **Week 11-12:** Set up CI/CD pipeline and monitoring

## Success Metrics

- **Coverage:** >95% of built-in functions tested
- **Accuracy:** >99% compatibility with Excel/Google Sheets for standard operations
- **Performance:** Competitive calculation speed (within 2x of Excel for common operations)
- **Automation:** Fully automated daily testing with <1% false positives

This plan provides a systematic approach to validating HyperFormula's correctness and performance against industry-standard spreadsheet applications, ensuring compatibility and competitive performance.
