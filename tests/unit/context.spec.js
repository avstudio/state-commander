import Context from '../../src/context'
import DefaultDefinition from '../../src/lib/default-definition'
import { resetContext } from '../helpers'

Context.use(DefaultDefinition)

describe('Context ', () => {
  beforeEach(() => {
    resetContext(Context)
    Context.use(DefaultDefinition)
  })

  describe('plugin support', () => {
    it('should extend Context', () => {
      const extension = {
        name: 'Plugin',
        install(ContextFactory) {
          const factory = ContextFactory
          factory.ext = 'Factory ext'
          factory.Base.ext = 'Some Class ext'
        },
        initialize(contextInstance, data) {
          const context = contextInstance
          context.ext = 'Some instance ext'
          context.data = data
        }
      }
      Context.use(extension)

      expect(Context.ext).toBe('Factory ext')
      const ContextClass = Context.createClass()
      expect(ContextClass.ext).toBe('Some Class ext')

      const context = new ContextClass({ opt: 'data' })
      expect(context.ext).toBe('Some instance ext')
      expect(context.data.opt).toBe('data')
    })

    it('should extend class', () => {
      Context.use({
        name: 'foo',
        install() { },
        extend(ContextClass) {
          const klass = ContextClass
          klass.method = 'Class extension'
        }
      })
      const C = Context.createClass()

      expect(Context.Base.method).toBeUndefined()
      expect(C.method).toBe('Class extension')
    })

    it('should validate extension to support install method and name', () => {
      expect(
        () => Context.use({ install() {} })
      ).toThrow(/missing plugin name/)
    })

    it('should invoke install only once', () => {
      const fn = jest.fn()
      const plugin = {
        name: 'Plugin',
        install: fn
      }
      Context.use(plugin)
      Context.use(plugin)
      Context.use(plugin)

      expect(fn).toBeCalledTimes(1)
    })

    it('should register hook', () => {
      const hookFn = jest.fn()
      const plugin = {
        name: 'Plugin',
        hooks: ['plugin:invoke'],
        install() { }
      }
      Context.use(plugin)
      Context.hooks['plugin:invoke'].attach(() => {
        hookFn()
      })
      Context.hooks['plugin:invoke'].execute({}, () => {})

      expect(hookFn).toBeCalled()
    })

    it('should throw error if hook is already registered', () => {
      Context.hooks['plugin:invoke'] = () => {}
      const plugin = {
        name: 'Plugin',
        hooks: ['plugin:invoke'],
        install() { }
      }
      expect(
        () => Context.use(plugin)
      ).toThrow(/already registered/)
    })

    it('should throw error if hook name is invalid', () => {
      const plugin = {
        name: 'Plugin',
        hooks: ['plugin/invoke'],
        install() { }
      }
      expect(
        () => Context.use(plugin)
      ).toThrow(/invalid hook name/)
    })

    it('should register configuration', () => {
      const plugin = {
        name: 'Plugin',
        configuration: {
          config: 'something'
        },
      }
      Context.use(plugin)

      expect(Context.configuration.plugin.config).toBe('something')
    })

    it('should register definition', () => {
      const plugin = {
        name: 'Plugin',
        definition: {
          someDefinition: {
            action: {
              invokeFn: () => {},
              handler: () => {}
            },
          }
        },
      }
      Context.use(plugin)

      expect(Context.definitions.someDefinition.action).toBeDefined()
    })

    describe('Definition', () => {
      it('should throw error if definition exists', () => {
        Context.definitions.someDefinition = {}

        const plugin = {
          name: 'Plugin',
          definition: {
            someDefinition: {
              action: 'action'
            }
          },
        }
        expect(
          () => Context.use(plugin)
        ).toThrow(/exists/)
      })

      it('should throw error if definition does not exists', () => {
        Context.definitions.someDefinition = {}
        expect(
          () => Context.createClass('invalid')
        ).toThrow(/not found/)
      })

      it('should throw error if definition is empty', () => {
        Context.definitions.someDefinition = {}
        const plugin = {
          name: 'Plugin',
          definition: {
          },
        }
        expect(
          () => Context.use(plugin)
        ).toThrow(/definition is empty/)
      })

      it('should throw error if action is missing', () => {
        Context.definitions.someDefinition = {}
        const plugin = {
          name: 'Plugin',
          definition: {
            test: {
            }
          },
        }
        expect(
          () => Context.use(plugin)
        ).toThrow(/definition is empty/)
      })

      it('should throw error action is empty', () => {
        Context.definitions.someDefinition = {}
        const plugin = {
          name: 'Plugin',
          definition: {
            test: {
              action: {
              }
            }
          },
        }
        expect(
          () => Context.use(plugin)
        ).toThrow(/definition of action is empty/)
      })

      it('should throw error if handler is missing', () => {
        Context.definitions.someDefinition = {}
        const plugin = {
          name: 'Plugin',
          definition: {
            test: {
              action: {
                map: 'map'
              }
            }
          },
        }
        expect(
          () => Context.use(plugin)
        ).toThrow(/missing handler/)
      })

      it('should throw error if invokeFn is missing', () => {
        Context.definitions.someDefinition = {}
        const plugin = {
          name: 'Plugin',
          definition: {
            test: {
              action: {
                handler: () => {}

              }
            }
          },
        }
        expect(
          () => Context.use(plugin)
        ).toThrow(/missing invokeFn/)
      })
    })
  })
})
