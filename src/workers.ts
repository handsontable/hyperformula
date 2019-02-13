import {Graph} from "./Graph";
import {Vertex} from "./Vertex";
import {AddressMapping} from "./AddressMapping";
import {SimpleArrayAddressMapping} from "./SimpleArrayAddressMapping";
import {GraphBuilder} from "./GraphBuilder";
import {RangeMapping} from "./RangeMapping";
import {Statistics} from "./statistics/Statistics";
import {Config} from "./Config";
import {Distributor} from "./Distributor";
import {findBoundaries} from "./index"

function init() {
  const sheet = [
    ["1", "2", "3"],
    ["=A1", "=B1", "=C1"]
  ]

  const graph = new Graph<Vertex>()
  const {width, height} = findBoundaries(sheet)
  const addressMapping = new SimpleArrayAddressMapping(width, height, graph)
  const graphBuilder = new GraphBuilder(graph, addressMapping, new RangeMapping(), new Statistics(), new Config())


  graphBuilder.buildGraph(sheet)

  const distributor = new Distributor(graph, addressMapping)
  const result = distributor.distribute()
  console.log(result)
}

init()
