import Module from '../../../src/lib/module'
import Handler from '../../../src/lib/handler'
import State from '../../../src/lib/state'
import DefaultDefinition from '../../../src/lib/default-definition'
import Context from '../../../src/context'
import { makeClass } from '../../helpers'

Context.use(DefaultDefinition)
Context.use(Handler)
Context.use(Module)
Context.use(State)

const ContextClass = Context.createClass()
let context
let CommandClass

beforeEach(() => {
  context = new ContextClass()
  CommandClass = makeClass('Command').onInstance({
    execute() { },
    commit() { }
  }).build()
})

describe('Module', () => {
  describe('Module#extend', () => {
    it('should extend Context', () => {
      expect(Context.Module).toBeDefined()
      expect(ContextClass.prototype.registerModule).toBeInstanceOf(Function)
      expect(ContextClass.prototype.unregisterModule).toBeInstanceOf(Function)
    })

    describe('Context#registerModule', () => {
      it('should throw error if argument is not string or instance of Module', () => {
        expect(
          () => context.registerModule(makeClass('Invalid').build())
        ).toThrow(/argument must be/)
      })

      it('should register new model', () => {
        const mdl = context.registerModule('some/path')
        expect(context._modules['some/path']).toBe(mdl)
      })

      it('should throw error if module exists', () => {
        context.registerModule('some/path')
        expect(
          () => context.registerModule('some/path')
        ).toThrow(/module already exists/)
      })

      it('should register commands from context constructor', () => {
        context = new ContextClass({
          commands: [
            makeClass('C1').onInstance({ execute() {} }).build(),
            makeClass('C2').onInstance({ execute() {} }).build()
          ]
        })

        expect(
          context.getModule('root').getCommands().length
        ).toBe(2)
      })
    })

    describe('Context#unregisterModule', () => {
      it('should throw error if argument is not string or instance of Module', () => {
        expect(
          () => context.unregisterModule(makeClass('Invalid').build())
        ).toThrow(/argument must be/)
      })

      it('should unregister model by path', () => {
        context.registerModule('some/path')
        context.unregisterModule('some/path')
        expect(context._modules['some/path']).toBeUndefined()
      })

      it('should unregister model by instance', () => {
        const mdl = context.registerModule('some/path')
        context.unregisterModule(mdl)
        expect(context._modules['some/path']).toBeUndefined()
      })

      it('should skip if module does not exists', () => {
        expect(
          () => context.unregisterModule('not_exists')
        ).not.toThrow()
      })

      it('should unregistered all module commands', () => {
        const mdl = context.registerModule('some/path', [
          makeClass('C1').onInstance({ execute() {} }).build(),
          makeClass('C2').onInstance({ execute() {} }).build()
        ])
        context.unregisterModule(mdl)
        expect(Object.keys(context._actions).length).toBe(0)
      })
    })
  })

  describe('Module#create', () => {
    it('should create root Module instance', () => {
      const mdl = Context.Module.create(context, 'ns/module')

      expect(mdl.context).toBe(context)
      expect(mdl.path).toBe('ns/module')
      expect(mdl.namespace).toBe('ns/module')
      expect(mdl.registrationKey).toBe('ns/module')
      expect(mdl.name).toBe('root')
    })

    it('should set predefined name', () => {
      const mdl = Context.Module.create(context, 'ns/module', { name: 'custom' })
      expect(mdl.name).toBe('custom')
    })

    it('should set commands', () => {
      const mdl = Context.Module.create(context, 'ns/module', {
        commands: [
          makeClass('C1').onInstance({ execute() {} }).build(),
          makeClass('C2').onInstance({ execute() {} }).build()
        ]
      })
      expect(mdl.getCommands().length).toBe(2)
    })
  })

  describe('Module#registerCommand', () => {
    it('should throw error if command class is not valid or missing', () => {
      const mdl = context.registerModule('some/path')
      expect(
        () => mdl.registerCommand(makeClass('Invalid').build())
      ).toThrow(/invalid command class/)
    })

    it('should add command', () => {
      const mdl = context.registerModule('some/path')
      mdl.registerCommand(makeClass('Command').onInstance({ execute() {} }).build())
      expect(mdl.getCommands().length).toBe(1)
    })

    it('should register and call handler', () => {
      const mdl = context.registerModule('some/path')
      const execute = jest.fn()
      const Command = makeClass('Command').onInstance({
        execute() {
          execute()
        }
      }).build()

      mdl.registerCommand(Command)

      Command.prototype.init = jest.fn()

      context._actions['some/path/command'].invoke('event', 'data')

      expect(execute).toHaveBeenCalledTimes(1)
      expect(Command.prototype.init).toBeCalledWith('event', 'data')
    })

    it('should register handlers only for defined class properties', () => {
      const mdl = context.registerModule('some/path')
      mdl.registerCommand(CommandClass)

      expect(context._initializers['init:some/path/command']).toBeUndefined()
      expect(context._actions['some/path/command']).toBeDefined()
      expect(context._mutations['commit:some/path/command']).toBeDefined()
    })

    it('should register all handlers', () => {
      const mdl = context.registerModule('some/path')
      const Command = makeClass('Command').onInstance({
        initialize() { },
        execute() { },
        commit() { },
        getter() { }
      }).build()

      mdl.registerCommand(Command)

      expect(context._initializers['init:some/path/command']).toBeDefined()
      expect(context._actions['some/path/command']).toBeDefined()
      expect(context._mutations['commit:some/path/command']).toBeDefined()
    })

    it('should call register hook', () => {
      const before = jest.fn()
      const after = jest.fn()
      const Command = makeClass('Command').onInstance({
        execute() { },
        commit() { }
      }).build()

      Context.hooks['module:register'].attach((data, _, next) => {
        before()
        next()
        after()
      })
      const mdl = context.registerModule('some/path')
      mdl.registerCommand(Command)

      expect(before).toHaveBeenCalledTimes(1)
      expect(after).toHaveBeenCalledTimes(1)
    })

    it('should set registration key', () => {
      const Command = makeClass('Command').onInstance({
        execute() { },
        commit() { }
      }).build()

      const mdl = context.registerModule('some/path')
      mdl.registerCommand(Command)
      expect(Command.registrationKey).toBe('some/path/command')
    })

    it('should exclude root prefix for root module', () => {
      const Command = makeClass('Command').onInstance({
        execute() { },
        commit() { }
      }).build()

      const mdl = context.getModule('root')
      mdl.registerCommand(Command)
      expect(Command.registrationKey).toBe('command')
    })
  })

  describe('Module#unregisterCommand', () => {
    it('should remove command', () => {
      const mdl = context.registerModule('some/module')
      mdl.registerCommand(CommandClass)
      mdl.unregisterCommand(CommandClass)
      expect(Object.keys(mdl.getCommands()).length).toBe(0)
    })

    it('should call unregister hook', () => {
      const before = jest.fn()
      const after = jest.fn()
      const Command = makeClass('Command').onInstance({
        execute() { },
        commit() { }
      }).build()

      Context.hooks['module:unregister'].attach((_, __, next) => {
        before()
        next()
        after()
      })
      const mdl = context.registerModule('some/path')
      mdl.unregisterCommand(Command)

      expect(before).toHaveBeenCalledTimes(1)
      expect(after).toHaveBeenCalledTimes(1)
    })
  })
})
