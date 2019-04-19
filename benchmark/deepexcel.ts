import {benchmarkMultiSheets} from "./benchmark";
import {Config} from "../src";

async function start() {
  await benchmarkMultiSheets("/tmp/default", [{address: "$resp7.A6", value: 0.9880945703}], new Config({
    csvDelimiter: ";",
    functionArgSeparator: ",",
    gpuMode: "cpu"
  }))

  await benchmarkMultiSheets("/tmp/maxpool", [{address: "$resp7.A6", value: 0.9880945703}], new Config({
    csvDelimiter: ";",
    functionArgSeparator: ",",
    gpuMode: "cpu"
  }))

  await benchmarkMultiSheets("/tmp/maxpool", [{address: "$resp7.A6", value: 0.9880945703}], new Config({
    csvDelimiter: ";",
    functionArgSeparator: ",",
    gpuMode: "gpu"
  }))
}

start()
