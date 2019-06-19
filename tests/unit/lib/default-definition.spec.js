import Context from '../../../src/context'
import DefaultDefinition from '../../../src/lib/default-definition'
import CommandDispatcher from '../../../src/lib/command-dispatcher'
import { resetContext } from '../../helpers'

Context.use(DefaultDefinition)
Context.use(CommandDispatcher)

const ContextClass = Context.createClass()

beforeEach(() => {
  resetContext(Context)
  Context.use(DefaultDefinition)
})

describe('DefaultDefinition Ext', () => {
  it('Should extend Context', () => {
    expect(Context.definitions.default).toBeDefined()
  })
})

describe('Default configuration', () => {
  it('should invoke valid async/sync context methods', () => {
    const context = new ContextClass()

    context._callCommand = jest.fn()
    context._callCommandSync = jest.fn()

    context.initialize('command')
    expect(context._callCommand).toBeCalledWith({}, 'init:command')

    context._callCommand.mockReset()
    context._callCommandSync.mockReset()

    context.dispatch('command', 'data')
    expect(context._callCommand).toBeCalledWith({}, 'command', 'data')

    context._callCommand.mockReset()
    context._callCommandSync.mockReset()

    context.commit('command', 'data')
    expect(context._callCommandSync).toBeCalledWith({}, 'commit:command', 'data')

    context._callCommand.mockReset()
    context._callCommandSync.mockReset()
  })

  it('should call all commands with * pattern match', () => {
    const context = new ContextClass()

    context._callAllCommands = jest.fn()

    context.initialize('*')
    expect(context._callAllCommands).toBeCalledWith({}, 'init:*')
  })

  it('should throw error without event argument', () => {
    const context = new ContextClass()

    context._callAllCommands = jest.fn()

    expect(
      () => context.initialize()
    ).toThrow(/not found/)
  })

  it('should override default definition', () => {
    Context.use({
      name: 'test',
      definition: {
        test: {
          someMethod: {
            map: 'collection',
            invokeFn: 'execute',
            handler: function handler() {}
          },
        }
      }
    })

    const C = Context.createClass('test')

    const newContext = new C()
    expect(Object.keys(newContext)).toEqual(['_collection', 'handler'])
  })

  it('should skip map', () => {
    Context.use({
      name: 'test',
      definition: {
        test: {
          someMethod: {
            invokeFn: 'execute',
            handler: function handler() {}
          },
        }
      }
    })

    const C = Context.createClass('test')

    const newContext = new C()
    expect(Object.keys(newContext)).toEqual(['handler'])
  })
})
