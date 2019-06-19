import { assert } from '../utils'

const configuration = {
  buildState: (state = {}) => state
}

const hooks = { }

function initState(contextInstance, force = false) {
  const context = contextInstance
  if (!context._state || force !== !1) {
    context.getters = {}
    context._state = configuration.buildState({})
  }
}

function registerState(key, state) {
  assert(key, 'missing key for state registration')

  initState(this)

  hooks['state:register'].execute(
    { key, state },
    this,
    () => {
      assert(!this._state[key], `state for ${key} already exists `)
      Object.assign(this._state, { [key]: state })
    }
  )
}

function unregisterState(key) {
  hooks['state:unregister'].execute(
    { key },
    this,
    () => {
      delete this._state[key]
      this._state = { ...this._state }
    }
  )
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

  // register module if it's not already registered
  if (!rootState[mKey]) {
    mdl.context.registerState(mKey, {})
  }

  const mState = rootState[mKey]

  // copy command state keys and assign to the module state
  Object.keys(state).forEach(
    (key) => {
      if (!mState[key]) {
        const obsItem = state[key]
        mState[key] = typeof obsItem === 'object'
          ? configuration.buildState(obsItem)
          : obsItem
      }
    }
  )

  // build state with factory and set to the instance
  Command.prototype.state = configuration.buildState(mState)

  // register command getter
  if (!getters[registrationKey] && typeof Command.prototype.getter === 'function') {
    Object.defineProperty(getters, registrationKey, {
      get() {
        return new Command().getter()
      }
    })
  }
}

const unregisterCommandHook = ({ command }, mdl, next) => {
  next()
  mdl.context.unregisterState(command.registrationKey, command.state)
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

    // attach to hook for command registration
    Context.hooks['module:register'].attach(registerCommandHook)
    Context.hooks['module:unregister'].attach(unregisterCommandHook)
  },
  initialize(context) {
    initState(context)
  },
  reset(context) {
    initState(context, true)
  }
}
