import { makeClass } from '../../helpers'
import Context from '../../../src/context'
import Module from '../../../src/lib/module'
import State from '../../../src/lib/state'
import Handler from '../../../src/lib/handler'
import CommandDispatcher from '../../../src/lib/command-dispatcher'
import DefaultDefinition from '../../../src/lib/default-definition'
import CommandHelpers from '../../../src/lib/command-helpers'

Context.use(CommandDispatcher)
Context.use(DefaultDefinition)
Context.use(Module)
Context.use(Handler)
Context.use(State)
Context.use(CommandHelpers)

const ContextClass = Context.createClass()

describe('CommandHelpers', () => {
  it('should extend context', () => {
    const context = new ContextClass()
    expect(context.getHelpers).toBeInstanceOf(Function)
  })


  describe('Command methods execution', () => {
    let SomeCommand

    beforeEach(() => {
      SomeCommand = makeClass('SomeCommand')
        .onInstance({
          initialize: jest.fn(),
          execute: jest.fn(),
          commit: jest.fn(),
          getter: jest.fn()
        }).build()
    })

    it('should generate helpers for root and second module', () => {
      const context = new ContextClass({
        commands: [SomeCommand]
      })

      context.registerModule('some/module', { commands: [SomeCommand] })

      const helperKeys = Object.keys(context.getHelpers()).sort()

      expect(helperKeys).toEqual([
        'initSomeCommand',
        'commitSomeCommand',
        'getSomeCommand',
        'someCommand',

        'initSomeModuleSomeCommand',
        'commitSomeModuleSomeCommand',
        'getSomeModuleSomeCommand',
        'someModuleSomeCommand',
      ].sort())
    })

    it('should call commands by invoking helpers', () => {
      const context = new ContextClass({
        commands: [SomeCommand]
      })

      SomeCommand.prototype.getter.mockReturnValue('hello')

      context.registerModule('some/module', { commands: [SomeCommand] })

      const command = new SomeCommand()

      const helpers = context.getHelpers()

      helpers.initSomeCommand()
      helpers.commitSomeCommand('payload')
      helpers.someCommand()

      expect(helpers.getSomeCommand()).toBe('hello')

      expect(command.initialize).toBeCalledTimes(1)
      expect(command.commit).toBeCalledTimes(1)
      expect(command.getter).toBeCalledTimes(1)
      expect(command.execute).toBeCalledTimes(1)

      helpers.initSomeModuleSomeCommand()
      helpers.commitSomeModuleSomeCommand()
      helpers.getSomeModuleSomeCommand()
      helpers.someModuleSomeCommand()

      expect(command.initialize).toBeCalledTimes(2)
      expect(command.commit).toBeCalledTimes(2)
      expect(command.getter).toBeCalledTimes(2)
      expect(command.execute).toBeCalledTimes(2)
    })

    it('should use predefined command helper names', () => {
      SomeCommand = makeClass('SomeCommand')
        .onClass({
          get helpers() {
            return {
              initialize: 'init',
              execute: 'find',
              commit: 'update',
              getter: 'get'
            }
          }
        })
        .onInstance({
          initialize: jest.fn(),
          execute: jest.fn(),
          commit: jest.fn(),
          getter: jest.fn()
        }).build()

      const context = new ContextClass({
        commands: [SomeCommand]
      })

      const helpers = Object.keys(context.getHelpers()).sort()

      expect(helpers).toEqual([
        'init',
        'find',
        'update',
        'get',
      ].sort())
    })

    it('should remove helpers when command is unregister', () => {
      const context = new ContextClass({
        commands: [SomeCommand]
      })
      context.getModule('root').unregisterCommand(SomeCommand)

      expect(Object.keys(context.getHelpers()).length).toBe(0)
    })

    it('should remove helpers when command is unregister for single module', () => {
      const NewCommand = class extends SomeCommand { }
      const context = new ContextClass({
        commands: [SomeCommand]
      })
      context.registerModule('some/module', { commands: [NewCommand] })
      context.getModule('root').unregisterCommand(SomeCommand)

      expect(Object.keys(context.getHelpers()).sort()).toEqual([
        'initSomeModuleNewCommand',
        'commitSomeModuleNewCommand',
        'getSomeModuleNewCommand',
        'someModuleNewCommand',
      ].sort())
    })

    it('should throw error if prefix GET is used in selected definition', () => {
      Context.definitions.default.foo = {
        prefix: 'GET',
        handler: function foo() {},
        invokeFn: 'foo',
      }

      expect(
        () => new ContextClass({ commands: [SomeCommand] })
      ).toThrow(/prefix GET is reserved and used by CommandHelpers module/)

      delete Context.definitions.default.foo
    })

    it('should generate getter only if getter is defined in command class', () => {
      SomeCommand = makeClass('SomeCommand')
        .onInstance({
          execute: jest.fn(),
        }).build()

      const context = new ContextClass({
        commands: [SomeCommand]
      })

      expect(context.getHelpers().getSomeCommand).toBeUndefined()
      expect(Object.keys(context.getHelpers()).length).toBe(1)
    })
  })
})
