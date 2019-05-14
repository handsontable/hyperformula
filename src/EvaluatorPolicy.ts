import {Config} from './Config'

export class EvaluatorPolicy {
  constructor(private readonly config: Config) {
  }

  public shouldBeParallel(independentSheets: boolean[]): boolean {
    return false
    for (const sheetIndependence of independentSheets) {
      if (sheetIndependence)
        return true
    }
    return false
  }
}
