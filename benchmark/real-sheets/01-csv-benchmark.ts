import {benchmarkCSV} from '../benchmark'
import * as fs from "fs";


fs.readFile("/home/voodoo11/Dokumenty/1-transactions.csv", "utf8", (err, data: string) => {
  benchmarkCSV(data, { millisecondsPerThousandRows: 25, numberOfRuns: 3 })
});

