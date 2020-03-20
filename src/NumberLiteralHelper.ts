import {Config} from './Config'

export class NumberLiteralHelper {
  private readonly numberPattern: RegExp
  private readonly allThousandSeparatorsRegex: RegExp

  constructor(
    private readonly config: Config
  ) {
    const thousandSeparator = this.config.thousandSeparator === '.' ? `\\${this.config.thousandSeparator}` : this.config.thousandSeparator
    const decimalSeparator = this.config.decimalSeparator === '.' ? `\\${this.config.decimalSeparator}` : this.config.decimalSeparator

    this.numberPattern = new RegExp(`^([\+-]?((${decimalSeparator}\\d+)|(\\d+(${thousandSeparator}\\d{3,})*(${decimalSeparator}\\d+)?)))$`)
    this.allThousandSeparatorsRegex = new RegExp(`${thousandSeparator}`, 'g')
    console.log()
  }
  
  public isNumber(input: string): boolean {
    const match =  this.numberPattern.test(input)
    return match
  }

  public numericStringToNumber(input: string): number {
    const normalized = input
      .replace(this.allThousandSeparatorsRegex, '')
      .replace(this.config.decimalSeparator, '.')
    return Number(normalized)
  }
}