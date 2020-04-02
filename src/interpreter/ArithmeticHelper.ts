import {Config} from '../Config'
import {DateHelper} from '../DateHelper'
import {NumberLiteralHelper} from '../NumberLiteralHelper'

export class ArithmeticHelper {
  constructor(
    private readonly config: Config,
    private readonly dateHelper: DateHelper,
    private readonly numberLiteralsHelper: NumberLiteralHelper,
  ) {

  }
}
