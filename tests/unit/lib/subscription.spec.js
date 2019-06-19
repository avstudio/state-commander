import { Context } from '../../../src'
import Subscription from '../../../src/lib/subscription'
import { makeClass } from '../../helpers'

Context.use(Subscription)

const ContextClass = Context.createClass()

describe('Subscription', () => {
  let context
  beforeEach(() => {
    context = new ContextClass()
  })

  it('should subscribe fn to after event and return unsubscribe function', () => {
    const cb = jest.fn()
    const unsubscribe = context.subscribe('foo', cb)
    context._subscriptions.after.foo()
    expect(cb).toBeCalled()
    unsubscribe()
    expect(context._subscriptions.foo).toBeUndefined()
  })

  it('should subscribe fn to before event and return unsubscribe function', () => {
    const cb = jest.fn()
    const unsubscribe = context.subscribe('foo:before', cb)
    context._subscriptions.before.foo()
    expect(cb).toBeCalled()
    unsubscribe()
    expect(context._subscriptions.foo).toBeUndefined()
  })

  it('should call listeners (after) on invoking command', () => {
    const SomeCommand = makeClass('SomeCommand').onInstance({
      initialize: jest.fn(),
      execute() {},
    }).build()
    const cb = jest.fn()
    context.registerModule('foo', { commands: [SomeCommand] })
    const unFn = context.subscribe('init:foo/someCommand', cb)
    context.initialize('*')
    expect(cb).toBeCalled()
    cb.mockClear()
    unFn()
    context.initialize('*')
    expect(cb).not.toBeCalled()
  })

  it('should call listeners (before) on invoking command', () => {
    const SomeCommand = makeClass('SomeCommand').onInstance({
      initialize: jest.fn(),
      execute() {},
    }).build()
    const cb = jest.fn()
    context.registerModule('foo', { commands: [SomeCommand] })
    const unFn = context.subscribe('init:foo/someCommand:before', cb)
    context.initialize('*')
    expect(cb).toBeCalled()
    cb.mockClear()
    unFn()
    context.initialize('*')
    expect(cb).not.toBeCalled()
  })

  it('should call listeners (before) on invoking command', () => {
    const SomeCommand = makeClass('SomeCommand').onInstance({
      commit: jest.fn(),
      execute() {},
    }).build()
    const cb = jest.fn()
    context.registerModule('foo', { commands: [SomeCommand] })
    context.subscribe('commit:foo/someCommand:before', cb)
    context.commit('foo/someCommand', { data: 'some' })
    const [args] = cb.mock.calls[0]

    expect(Object.keys(args)).toEqual(['context', 'command', 'event'])
  })
})
