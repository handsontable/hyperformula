import {benchmark, benchmarkMultiSheets} from "./benchmark";
import {Config} from "../src";

async function start() {
  console.info(' === DeepExcel default === ')
  await benchmarkMultiSheets("/tmp/default", [{address: "$resp7.A6", value: 0.9880945703}], new Config({
    csvDelimiter: ";",
    functionArgSeparator: ",",
    gpuMode: "cpu"
  }))

  console.info('\n === DeepExcel - resp1/resp3 as maxpool - CPU === ')
  await benchmarkMultiSheets("/tmp/maxpool", [{address: "$resp7.A6", value: 0.9880945703}], new Config({
    csvDelimiter: ";",
    functionArgSeparator: ",",
    gpuMode: "cpu"
  }))

  console.info('\n === DeepExcel - resp1/resp3 as maxpool - GPU === ')
  await benchmarkMultiSheets("/tmp/maxpool", [{address: "$resp7.A6", value: 0.9880945703}], new Config({
    csvDelimiter: ";",
    functionArgSeparator: ",",
    gpuMode: "gpu"
  }))
}

start()
