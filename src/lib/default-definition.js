const definition = {
  initializer: {
    prefix: 'init',
    map: 'initializers',
    invokeFn: 'initialize',
    // invoke multiple commands with pattern matching
    // todo improve this
    handler: /* async */ function initialize(event) {
      if (/\*/.test(event || '')) {
        return this._callAllCommands(this._initializers, event)
      }
      return this._callCommand(this._initializers, event)
    }
  },
  action: {
    map: 'actions',
    invokeFn: 'execute',
    // note the name here
    handler: /* async */ function dispatch(event, payload) {
      return this._callCommand(this._actions, event, payload)
    }
  },
  mutation: {
    map: 'mutations',
    prefix: 'commit',
    invokeFn: 'commit',
    // note the name here
    handler: function commit(event, payload) {
      return this._callCommandSync(this._mutations, event, payload)
    }
  },
}

export default {
  name: 'DefaultDefinition',
  definition: {
    default: definition
  },
  initialize(contextInstance) {
    const context = contextInstance
    Object.entries(context.constructor.definition).forEach(([, item]) => {
      if (item.map) {
        context[`_${item.map}`] = Object.create(null)
      }

      context[item.handler.name] = (event, payload) => item.handler.call(
        context,
        item.prefix ? `${item.prefix}:${event}` : event,
        payload
      )
    })
  },
}
