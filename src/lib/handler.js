import { makeRegistrationKey } from '../utils'

const hooks = { }

class Base {
  constructor(fn) {
    this._invokeFn = fn
  }

  invoke(event, payload) {
    let res
    hooks['handler:invoke'].execute(
      { event, payload, context: this },
      () => {
        res = this._invokeFn(event, payload)
      }
    )
    return res
  }
}

const HandlerFactory = {
  Base,
  createClass() {
    const Handler = class extends this.Base { }
    return Handler
  },
  create(mdl, Command, definition) {
    const { invokeFn } = definition
    const HandlerClass = this.createClass()

    const handler = new HandlerClass()
    Object.defineProperty(handler, 'module', {
      get() { return mdl }
    })

    Object.defineProperty(handler, '_definition', {
      get() { return definition }
    })

    Object.defineProperty(handler, '_invokeFn', {
      get() {
        return (...data) => (invokeFn instanceof Function
          ? invokeFn(new Command(...data))
          : new Command(...data)[invokeFn]())
      }
    })

    Object.defineProperty(handler, 'registrationKey', {
      get() {
        return makeRegistrationKey(
          {
            path: mdl.namespace,
            command: Command.name,
            prefix: definition.prefix
          }
        )
      }
    })

    return handler
  }
}

export default {
  name: 'Handler',
  hooks: ['handler:invoke'],
  install(ContextFactory) {
    const Context = ContextFactory
    Context.Handler = HandlerFactory
    hooks['handler:invoke'] = Context.hooks['handler:invoke']
    Context.Base.Handler = Context.Handler
  }
}
