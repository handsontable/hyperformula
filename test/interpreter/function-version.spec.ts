import {HyperFormula} from '../../src'
import {ProtectedFunctionError} from '../../src/errors'
import {InterpreterValue} from '../../src/interpreter/InterpreterValue'
import {FunctionPlugin, FunctionPluginTypecheck} from '../../src/interpreter/plugin/FunctionPlugin'
import {adr} from '../testUtils'

describe('Function VERSION', () => {
  describe('getting version', () => {
    it('GPL license key', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['=VERSION()'],
      ], {
        licenseKey: 'gpl-v3',
      })

      expect(engine.getCellValue(adr('A1'))).toEqual(`HyperFormula v${HyperFormula.version}, 1`)
    })

    it('missing license key', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['=VERSION()'],
      ], {
        licenseKey: '',
      })

      expect(engine.getCellValue(adr('A1'))).toEqual(`HyperFormula v${HyperFormula.version}, 2`)
    })

    it('invalid license key', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['=VERSION()'],
      ], {
        licenseKey: '11111-11111-11111-11111-11111',
      })

      expect(engine.getCellValue(adr('A1'))).toEqual(`HyperFormula v${HyperFormula.version}, 3`)
    })

    it('expired license key', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['=VERSION()'],
      ], {
        licenseKey: '80584-cc272-2e7c4-06f16-4db00',
      })

      expect(engine.getCellValue(adr('A1'))).toEqual(`HyperFormula v${HyperFormula.version}, 4`)
    })

    it('correct license key', () => {
      const [engine] = HyperFormula.buildFromArray([
        ['=VERSION()'],
      ], {
        licenseKey: 'internal-use-in-handsontable',
      })

      expect(engine.getCellValue(adr('A1'))).toEqual(`HyperFormula v${HyperFormula.version}, table`)
    })
  })

  describe('registering', () => {
    class VersionExtra extends FunctionPlugin implements FunctionPluginTypecheck<VersionExtra> {
      public static implementedFunctions = {
        'VERSION': {
          method: 'version',
        }
      }

      public version(): InterpreterValue {
        return 'version'
      }
    }

    it('should not allow registering VERSION formula', () => {
      expect(() => {
        HyperFormula.buildFromArray([
          ['=VERSION()'],
        ], {
          licenseKey: 'gpl-v3',
          functionPlugins: [VersionExtra]
        })
      }).toThrow(ProtectedFunctionError.cannotRegisterFunctionWithId('VERSION'))
    })

    it('should be available even if anyone unregistered ', () => {
      expect(() => {
        HyperFormula.unregisterFunction('VERSION')
      }).toThrow(ProtectedFunctionError.cannotUnregisterFunctionWithId('VERSION'))

      const [engine] = HyperFormula.buildFromArray([
        ['=VERSION()'],
      ], {
        licenseKey: 'gpl-v3',
      })

      expect(engine.getCellValue(adr('A1'))).toEqual(`HyperFormula v${HyperFormula.version}, 1`)
    })
  })
})
