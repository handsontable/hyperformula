import {Config} from './Config'

export class EvaluatorPolicy {
  constructor(private readonly config: Config) {
  }

  public shouldBeParallel(independentSheets: boolean[]): boolean {
    switch (this.config.evaluator) {
      case 'parallel':
        return true
      case 'single-thread':
        return false
      case 'auto':
        return this.choose(independentSheets)
    }
  }

  private choose(independentSheets: boolean[]): boolean {
    if (independentSheets.length <= 1) {
      return false
    }
    for (const sheetIndependence of independentSheets) {
      if (sheetIndependence) {
        return true
      }
    }
    return false
  }
}
