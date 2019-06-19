import { makeHelperName, assert } from '../utils'

const getFnName = fn => (typeof fn === 'function' ? fn.name : fn)
const createHelperName = (
  custom, prefix, registrationKey
) => custom || makeHelperName(`${prefix || ''}/${registrationKey}`)


const registerCommandHook = ({ command }, mdl, next) => {
  const { context } = mdl
  // init map if does not exists
  if (!context._helpers) { context._helpers = {} }

  // let module continue with his job
  next()

  const Command = command
  const { helpers = {}, registrationKey } = Command
  const { getters } = context
  const { definition } = context.constructor

  // collect all definition actions and create helper names based on the invoke function name
  Object.values(definition).forEach((item) => {
    const invokeFnName = getFnName(item.invokeFn)
    if (typeof Command.prototype[invokeFnName] === 'function') {
      // use user predefined name if exists or compute one
      const helperName = helpers[invokeFnName] || createHelperName(null, item.prefix, registrationKey)
      if (!context._helpers[helperName]) {
        const handlerName = item.handler.name
        const handlerFn = context[handlerName]
        // connect helper name and handler
        context._helpers[helperName] = payload => handlerFn(registrationKey, payload)
      }
    }
  })

  if (typeof Command.prototype.getter === 'function') {
    const getterHelperName = createHelperName(helpers.getter, 'get', registrationKey)

    if (!context._helpers[getterHelperName]) {
      context._helpers[getterHelperName] = () => getters[registrationKey]
    }
  }
}

const unregisterCommandHook = ({ command }, mdl, next) => {
  next()

  const Command = command
  const { helpers = {}, registrationKey } = Command
  const { context } = mdl
  const { definition } = context.constructor

  const getterHelperName = createHelperName(helpers.getter, 'get', registrationKey)
  delete context._helpers[getterHelperName]

  Object.values(definition).forEach((item) => {
    const invokeFnName = getFnName(item.invokeFn)
    const helperName = helpers[invokeFnName] || createHelperName(null, item.prefix, registrationKey)
    delete context._helpers[helperName]
  })
}

function getHelpers() {
  return this._helpers
}

export default {
  name: 'CommandHelpers',
  description: 'Generate helper methods for registered commands',
  install(ContextFactory) {
    const Context = ContextFactory

    assert(Context.State, 'Missing State which is required by Command Helpers')

    // attach to hook for command registration
    Context.hooks['module:register'].attach(registerCommandHook)
    Context.hooks['module:unregister'].attach(unregisterCommandHook)

    Context.Base.prototype.getHelpers = getHelpers
  },
  initialize(context) {
    // prevent user to define GET prefix because it is used here in construction of getter helper name
    assert(
      !Object.values(context.constructor.definition).some(el => /get/i.test(el.prefix)),
      'prefix GET is reserved and used by CommandHelpers module. Please consider to define different prefix in context definition'
    )
  }
}
