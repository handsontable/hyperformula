import {Config} from './Config'

export class NumberLiteralsHelper {
  private readonly numberPattern: RegExp

  constructor(
    private readonly config: Config
  ) {
    this.numberPattern = new RegExp(`^[\+|-]?\\d*[${this.config.thousandSeparator}\\d{3,}]*[${this.config.decimalSeparator}]?\\d+$`)
  }

  public isNumber(input: string): boolean {
    return this.numberPattern.test(input)
  }

  public numericStringToNumber(input: string): number {
    const normalized = input.replace(this.config.decimalSeparator, '.').replace(this.config.thousandSeparator, '')
    return Number(normalized)
  }
}