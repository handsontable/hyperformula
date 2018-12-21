# HandsOnEngine

## Scripts

### handsonengine-convert

This script provides converter from CSV with formulas (exported from other tool) to CSV with values computed by our engine.

Usage:

```
yarn ts-node bin/handsonengine-convert formulas.csv ours.csv
```

### handsonengine-diff

This script provides a diff tool between 3 csv files: formulas csv file, expected values csv file (exported from other tool) and with another CSV computed by our engine.

Usage:

```
yarn ts-node bin/handsonengine-diff formulas.csv expected-values.csv ours.csv 0,3,7
```

The last argument is optional and represent columns to be ignored in final diff. That argument are zero-based, comma-separated indexes of columns, so for example `0,3,7` tells the script to ignore columns `A`, `D` and `H`.
