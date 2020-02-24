import {Config} from './Config'

export function collatorFromConfig(config: Config): Intl.Collator {
  return new Intl.Collator(config.localeLang)
}

