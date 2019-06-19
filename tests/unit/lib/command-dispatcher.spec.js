import Context from '../../../src/context'
import Handler from '../../../src/lib/handler'
import Module from '../../../src/lib/module'
import CommandDispatcher from '../../../src/lib/command-dispatcher'
import DefaultDefinition from '../../../src/lib/default-definition'
import { isPromise } from '../../../src/utils'
import { makeClass } from '../../helpers'

Context.use(Handler)
Context.use(Module)
Context.use(DefaultDefinition)
Context.use(CommandDispatcher)

const ContextClass = Context.createClass()

const handler = (Command, invokeFn) => ({
  invoke(...data) {
    return invokeFn instanceof Function
      ? invokeFn(new Command(...data))
      : new Command(...data)[invokeFn]()
  }
})

describe('CommandDispatcher', () => {
  it('Should extend Context', () => {
    const context = new ContextClass()
    expect(context._callCommand).toBeInstanceOf(Function)
    expect(context._callCommandSync).toBeInstanceOf(Function)
    expect(context._commandNotFound).toBeInstanceOf(Function)
    expect(Context.hooks['command:invoke']).toBeDefined()
  })

  describe('Command methods execution', () => {
    let context
    let SomeCommand

    beforeEach(() => {
      context = new ContextClass()

      SomeCommand = makeClass('SomeCommand').onInstance({
        initialize: jest.fn(),
        execute: jest.fn(),
        commit: jest.fn(),
        getter: jest.fn()
      }).build()

      // instead overriding constructor use this fn. See makeClass helper
      SomeCommand.prototype.init = jest.fn()

      Object.entries(ContextClass.definition).forEach(([, item]) => {
        const cName = item.prefix ? `${item.prefix}:command` : 'command'
        context[`_${item.map}`][cName] = handler(SomeCommand, item.invokeFn)
      })
    })

    it('should invoke initializer', () => {
      context.initialize('command')
      expect(SomeCommand.prototype.initialize).toBeCalledWith()
    })

    it('should invoke action and return promise', () => {
      const res = context.dispatch('command', 'data')
      expect(SomeCommand.prototype.init).toBeCalledWith('command', 'data')
      expect(SomeCommand.prototype.execute).toBeCalled()
      expect(isPromise(res)).toBe(true)
    })

    it('should invoke mutation', () => {
      context.commit('command', 'data')
      expect(SomeCommand.prototype.init).toBeCalledWith('commit:command', 'data')
      expect(SomeCommand.prototype.commit).toBeCalled()
    })

    it('should call hooks', () => {
      const before = jest.fn()
      const after = jest.fn()
      Context.hooks['command:invoke'].attach((_, __, next) => {
        before()
        next()
        after()
      })

      context.commit('command')
      expect(SomeCommand.prototype.commit).toBeCalledWith()

      expect(before).toHaveBeenCalledTimes(1)
      expect(after).toHaveBeenCalledTimes(1)
    })

    it('should call notFoundHandler if command does not exists', () => {
      expect(
        () => context.commit('not_exist')
      ).toThrow(/Command not found/)
    })

    it('should be able to override default command not found handler', () => {
      const fn = () => { throw new Error('overridden not found') }
      const cc = Context.configuration
      const old = cc.notFoundHandler
      cc.notFoundHandler = fn
      expect(
        () => context.commit('not_exist')
      ).toThrow(/overridden not found/)
      cc.notFoundHandler = old
    })

    it('should call notFoundHandler if command does not exists', () => {
      expect(
        () => context.commit('not_exist')
      ).toThrow(/Command not found/)
    })

    describe('Pattern matching events', () => {
      it('should multiple commands with patter matching', () => {
        const init1 = jest.fn()
        const init2 = jest.fn()
        const c1 = makeClass('Destroy')
          .onInstance({ initialize: init1, execute() {} }).build()
        const c2 = makeClass('Update')
          .onInstance({ initialize: init2, execute() {} }).build()

        context.registerModule('foo', { commands: [c1] })
        context.registerModule('bar', { commands: [c2] })

        context.initialize('*').then(() => ({}))

        expect(init1).toBeCalledTimes(1)
        expect(init2).toBeCalledTimes(1)

        init1.mockClear()
        init2.mockClear()

        context.initialize('foo/*').then(() => ({}))

        expect(init1).toBeCalledTimes(1)
        expect(init2).not.toBeCalled()

        init1.mockClear()
        init2.mockClear()

        context.initialize('bar*destroy').then(() => ({}))

        expect(init1).not.toBeCalled()
        expect(init2).not.toBeCalled()
      })
    })
  })
})
