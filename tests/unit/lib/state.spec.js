import DefaultDefinition from '../../../src/lib/default-definition'
import State from '../../../src/lib/state'
import Handler from '../../../src/lib/handler'
import Module from '../../../src/lib/module'
import Context from '../../../src/context'
import { makeClass } from '../../helpers'

Context.use(DefaultDefinition)
Context.use(Module)
Context.use(Handler)
Context.use(State)

const ContextClass = Context.createClass()

let context

beforeEach(() => {
  context = new ContextClass()
})

describe('State', () => {
  it('should extend Context', () => {
    expect(Context.hooks['state:register']).toBeDefined()
    expect(Context.hooks['state:unregister']).toBeDefined()
    expect(Context.Base.prototype.registerState).toBeInstanceOf(Function)
    expect(Context.Base.prototype.unregisterState).toBeInstanceOf(Function)
  })

  it('should set context state', () => {
    context.registerState('foo', { some: 'value' })
    expect(context.state.foo.some).toBe('value')
  })

  it('should throw error if key exists', () => {
    context.registerState('foo', { some: 'value' })
    expect(
      () => context.registerState('foo', { some: 'value' })
    ).toThrow(/already exists/)
  })

  it('should call hook', () => {
    const before = jest.fn()
    const after = jest.fn()
    Context.hooks['state:register'].attach((data, _, next) => {
      before()
      next()
      after()
    })
    context.registerState('foo', { some: 'value' })

    expect(before).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
  })

  it('should register state', () => {
    const mdl = context.registerModule('some/module')
    const Command = makeClass('Command')
      .onInstance({
        getter() { }
      })
      .onClass({
        get state() {
          return { value: 'some' }
        }
      })
      .build()

    mdl.registerCommand(Command)
    const command = new Command()
    expect(command.rootState['some/module'].value).toBe('some')
    expect(command.state.value).toBe('some')
    expect(context._state['some/module'].value).toBe('some')
  })

  it('should not override existing value', () => {
    context.registerState('foo', { value: 'old' })

    const mdl = context.registerModule('foo')
    const Command = makeClass('Command')
      .onInstance({
        getter() {
          return this.state.value
        }
      })
      .onClass({
        get state() {
          return { value: 'new' }
        }
      })
      .build()

    mdl.registerCommand(Command)

    expect(context._state.foo.value).toBe('old')
  })

  it('should define (clone) property getter from class static state definition', () => {
    const Command = makeClass('Command')
      .onInstance({
        execute() { },
        commit() { }
      })
      .onClass({
        get state() {
          return {
            get foo() {
              return 'foo'
            },
            bar: 'bar'
          }
        }
      })
      .build()
    let desc

    context.registerModule('moduleFoo', { commands: [Command] })
    desc = Object.getOwnPropertyDescriptor(context.state.modulefoo, 'foo')
    expect(desc.writable).toBeUndefined()

    desc = Object.getOwnPropertyDescriptor(context.state.modulefoo, 'bar')
    expect(desc.writable).toBe(true)
  })

  it('should register state for root module', () => {
    const mdl = context._modules.root
    const Command = makeClass('Command')
      .onInstance({
        getter() { }
      })
      .onClass({
        get state() {
          return { value: 'some' }
        }
      })
      .build()

    mdl.registerCommand(Command)
    const command = new Command()
    expect(command.rootState.root.value).toBe('some')
    expect(command.state.value).toBe('some')
    expect(context._state.root.value).toBe('some')
  })

  it('should assign existing state to the command', () => {
    const mdl = context.registerModule('some/module')
    context._state['some/module'] = { value: 'exists' }
    const Command = makeClass('Command')
      .onInstance({
        getter() { }
      })
      .onClass({
        get state() {
          return { value: 'some' }
        }
      })
      .build()

    mdl.registerCommand(Command)
    const command = new Command()
    expect(command.rootState['some/module'].value).toBe('exists')
    expect(command.state.value).toBe('exists')
    expect(context._state['some/module'].value).toBe('exists')
  })

  it('should unregister state', () => {
    const mdl = context.registerModule('some/module')
    const Command = makeClass('Command')
      .onInstance({
        getter() {
          return this.state.value
        }
      })
      .onClass({
        get state() {
          return { value: 'some' }
        }
      })
      .build()

    mdl.registerCommand(Command)

    expect(context._state['some/module']).toBeDefined()

    context.unregisterModule(mdl)

    expect(context._state['some/module/command']).toBeUndefined()
  })

  it('should register getter', () => {
    const mdl = context.registerModule('some/module')
    const Command = makeClass('Command')
      .onInstance({
        getter() {
          return this.state.value
        }
      })
      .onClass({
        get state() {
          return { value: 'some' }
        }
      })
      .build()

    mdl.registerCommand(Command)

    expect(context.getters['some/module/command']).toBe('some')
  })
})
