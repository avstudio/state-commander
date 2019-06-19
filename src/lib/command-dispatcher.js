import { assert, isPromise } from '../utils'

const hooks = {}
const configuration = { }
// todo improve this
const patternKeyRegex = pattern => new RegExp(
  /\/*/.test(pattern) ? pattern.replace('*', '(.*?)') : 'a^'
)

const defaultNotFoundHandler = e => assert(false, `Command not found ${e}`)


function _callCommandSync(map, event, payload) {
  let res

  hooks['command:invoke'].execute({
    map,
    event,
    payload
  },
  this,
  () => {
    const handler = map[event]
    res = handler
      ? handler.invoke(event, payload)
      : this._commandNotFound(event, payload)
  })
  return res
}

function _commandNotFound(event, data) {
  configuration.notFoundHandler()(event, data)
}

function _callCommand(map, event, payload) {
  const response = this._callCommandSync(map, event, payload)
  if (!isPromise(response)) {
    return Promise.resolve(response)
  }
  return response
}

function _callAllCommands(map, event, data) {
  if (/\/*/.test(event)) {
    const reg = patternKeyRegex(event)
    return Promise.all(Object.keys(map).reduce((prev, key) => {
      if (reg.test(key)) {
        prev.push(this._callCommand(map, key, data))
      }
      return prev
    }, []))
  }
  return Promise.all([])
}

export default {
  name: 'CommandDispatcher',
  hooks: ['command:invoke'],
  install(ContextFactory) {
    const Context = ContextFactory
    const proto = Context.Base.prototype

    proto._callCommand = _callCommand
    proto._callCommandSync = _callCommandSync
    proto._callAllCommands = _callAllCommands
    proto._commandNotFound = _commandNotFound

    // workaround to skip namespace for this module in Context configuration
    configuration.notFoundHandler = (
    ) => Context.configuration.notFoundHandler || defaultNotFoundHandler

    hooks['command:invoke'] = Context.hooks['command:invoke']
  }
}
