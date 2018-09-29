import { HandsOnEngine } from "../src";

describe('iasdfa', () => {
  it('#loadSheet', () => {
    const hoe = new HandsOnEngine()

    hoe.loadSheet([
      ['1', 'A5', '=SUM(1,2,3)'],
      ['foo', 'bar', '=A2']
    ])
  });
});
