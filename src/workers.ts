import {Graph} from "./Graph";
import {Vertex} from "./Vertex";
import {AddressMapping} from "./AddressMapping";
import {GraphBuilder} from "./GraphBuilder";
import {RangeMapping} from "./RangeMapping";
import {Statistics} from "./statistics/Statistics";
import {Config} from "./Config";
import {Distributor} from "./Distributor";

function init() {
  const graph = new Graph<Vertex>()
  const addressMapping = new AddressMapping()
  const graphBuilder = new GraphBuilder(graph, addressMapping, new RangeMapping(), new Statistics(), new Config())


  const sheet = [
    ["1", "2", "3"],
    ["=A1", "=B1", "=C1"]
  ]

  graphBuilder.buildGraph(sheet)

  const distributor = new Distributor(graph, addressMapping)
  const result = distributor.distribute()
  console.log(result)
}

init()