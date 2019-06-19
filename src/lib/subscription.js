import { assert } from '../utils'

function subscribe(event, fn) {
  const when = /:before$/.test(event) ? 'before' : 'after'
  const subEvent = event.replace(/:\w+$/, '')

  if (!this._subscriptions[when][subEvent]) {
    this._subscriptions[when][subEvent] = fn
  }
  return () => {
    delete this._subscriptions[when][subEvent]
  }
}

function getEventFn(ctx, when, event) {
  return ctx._subscriptions[when][event] || (() => {})
}

function invokeHook(data, next) {
  const { event, context: handler } = data
  const { module, command } = handler
  const { context } = module

  getEventFn(context, 'before', event)({ context, command, event })
  next()
  getEventFn(context, 'after', event)({ context, command, event })
}

export default {
  name: 'Subscription',
  description: 'Event listener',
  install(ContextFactory) {
    const Context = ContextFactory

    assert(Context.Handler, 'handler is required')

    Context.Base.prototype.subscribe = subscribe
    Context.hooks['handler:invoke'].attach(invokeHook)
  },
  initialize(context, options) {
    context.reset(context, options)
  },
  reset(contextInstance) {
    const context = contextInstance
    context._subscriptions = {
      before: {},
      after: {},
    }
  }
}
