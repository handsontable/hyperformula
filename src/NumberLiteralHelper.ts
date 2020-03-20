import {Config} from './Config'

export class NumberLiteralHelper {
  private readonly numberPattern: RegExp
  private readonly allThousandSeparatorsRegex: RegExp

  constructor(
    private readonly config: Config
  ) {
    this.numberPattern = new RegExp(`^([\+-]?((\\${this.config.decimalSeparator}\\d+)|(\\d+(${this.config.thousandSeparator}\\d{3,})*(\\${this.config.decimalSeparator}\\d+)?)))$`)
    this.allThousandSeparatorsRegex = new RegExp(`${this.config.thousandSeparator}`, 'g')
  }
  
  public isNumber(input: string): boolean {
    const match =  this.numberPattern.test(input)
    return match
  }

  public numericStringToNumber(input: string): number {
    const normalized = input
      .replace(this.config.decimalSeparator, '.')
      .replace(this.allThousandSeparatorsRegex, '')
    return Number(normalized)
  }
}