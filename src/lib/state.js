import { assert } from '../utils'

const configuration = {
  buildState: (state = {}) => state,
  setState: (oldState, key, value) => Object.assign(oldState, { [key]: value })
}

const hooks = { }

function initState(contextInstance, force = false) {
  const context = contextInstance
  if (!context._state || force !== !1) {
    context.getters = {}
    context._state = configuration.buildState({})
  }
}

function registerState(key, state, { override = false } = {}) {
  assert(key, 'missing key for state registration')

  initState(this)

  hooks['state:register'].execute(
    { key, state },
    this,
    () => {
      assert(!(override === !1 && this._state[key]), `state for ${key} already exists `)

      configuration.setState(this._state, key, state)
    }
  )
}

function unregisterState(key) {
  hooks['state:unregister'].execute(
    { key },
    this,
    () => {
      delete this.getters[key]

      Object.getOwnPropertyNames(this.getters).forEach((k) => {
        if (k.startsWith(key)) {
          delete this.getters[k]
        }
      })

      delete this._state[key]
    }
  )
}

const registerHook = ({ module: mdl }, context, next) => {
  // first time
  initState(context)
  // let module to the things first
  next()

  const key = mdl.registrationKey

  // register module if it's not already registered
  if (!context.state[key]) {
    context.registerState(key, {})
  }
}

const unregisterHook = ({ module: mdl }, context, next) => {
  next()
  mdl.context.unregisterState(mdl.registrationKey)
}

const registerCommandHook = ({ command }, mdl, next) => {
  // first time
  initState(mdl.context)
  // let module to the things first
  next()

  const Command = command
  const { state = {}, registrationKey } = Command
  const { getters, state: rootState } = mdl.context

  // set context state to be available to command class instance
  Command.prototype.rootState = rootState

  const mKey = mdl.registrationKey

  // register module if doesn't exists
  if (!rootState[mKey]) {
    mdl.context.registerState(mKey, {})
  }

  const mState = rootState[mKey]

  // copy command state keys and assign to the module state
  Object.keys(state).forEach(
    (key) => {
      if (!mState[key]) {
        const desc = Object.getOwnPropertyDescriptor(state, key)
        // TODO rethink this
        // check if state property is not only getter
        if (desc.writable) {
        // use setter function from configuration
          configuration.setState(mState, key, state[key])
        } else {
          // define getter only
          Object.defineProperty(mState, key, desc)
        }
      }
    }
  )

  // build state with factory and set to the instance
  Command.prototype.state = mState

  // register command getter
  if (!getters[registrationKey] && typeof Command.prototype.getter === 'function') {
    Object.defineProperty(getters, registrationKey, {
      get() {
        return new Command().getter()
      },
      configurable: true
    })
  }
}

const unregisterCommandHook = ({ command }, mdl, next) => {
  next()
  mdl.context.unregisterState(command.registrationKey)
}

export default {
  name: 'State',
  hooks: ['state:register', 'state:unregister'],
  configuration,
  install(ContextFactory) {
    const Context = ContextFactory

    Context.State = this

    Object.defineProperty(Context.Base.prototype, 'state', {
      get() {
        initState(this)
        return this._state
      },
    })
    Context.Base.prototype.registerState = registerState
    Context.Base.prototype.unregisterState = unregisterState

    assert(Context.Module, 'Missing Module which is required by State')

    // keep reference
    hooks['state:register'] = Context.hooks['state:register']
    hooks['state:unregister'] = Context.hooks['state:unregister']

    // attach handlers on the command registration hook to set the state
    Context.hooks['module:register'].attach(registerHook)
    Context.hooks['module:unregister'].attach(unregisterHook)
    Context.hooks['module:registerCommand'].attach(registerCommandHook)
    Context.hooks['module:unregisterCommand'].attach(unregisterCommandHook)
  },
  initialize(context) {
    initState(context)
  },
  reset(context) {
    initState(context, true)
  }
}
