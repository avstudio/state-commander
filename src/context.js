import { assert, toLowerCaseFirst } from './utils'
import Hook from './hook'

const hooks = {}
const extensions = []
const configuration = {}
const definitions = {}
const PluginInterface = [
  'extend', // a function that will be invoked when new context class is  created
  'name', // registration name
  'description',
  'initialize', // a function that will be invoked on class initialization
  'reset'// a function that will be invoked on context reset
]

function registerHook(name) {
  assert(/^[\w/]+:\w+$/.test(name), 'invalid hook name. It should be: pluginNamePrefix:hookName')
  assert(!this.hooks[name], `hook ${name} is already registered`)
  Object.assign(this.hooks, { [name]: new Hook() })
}

function registerConfig(ext, config = {}) {
  const configName = toLowerCaseFirst(ext)
  if (!this.configuration[configName]) {
    Object.assign(this.configuration, { [configName]: config })
  }
}

function registerDefinition(definition = {}) {
  const [[key, entry = {}] = []] = Object.entries(definition)

  assert(key && Object.keys(entry).length, 'definition is empty')

  assert(!this.definitions[key], `definition ${key} already exists`)

  Object.entries(entry).forEach(([, item]) => {
    assert(Object.keys(item).length, 'definition of action is empty')
    assert(item.handler instanceof Function, 'missing handler')
    assert(item.invokeFn, 'missing invokeFn')
  })

  Object.assign(this.definitions, { [key]: definition[key] })
}

class Base {
  constructor(...data) {
    extensions.filter(ext => ext.initialize).forEach(ext => ext.initialize(this, ...data))
  }

  reset() {
    extensions.filter(ext => ext.reset).forEach(ext => ext.reset(this))
  }
}

export default {
  get Base() { return Base },
  get hooks() { return hooks },
  get configuration() { return configuration },
  get definitions() { return definitions },
  get extensions() { return extensions },
  use(ext, ...args) {
    assert(ext.name, 'missing plugin name')

    if (extensions.find(e => e.name === ext.name)) {
      return
    }

    if (ext.hooks) {
      ext.hooks.forEach((hook) => {
        registerHook.call(this, hook)
      })
    }

    if (ext.configuration) {
      registerConfig.call(this, ext.name, ext.configuration)
    }

    if (ext.definition) {
      registerDefinition.call(this, ext.definition)
    }

    if (ext.install) {
      ext.install(this, ...args)
    }

    PluginInterface.filter(n => ext[n])

    // reduce object with interface properties
    extensions.push(
      PluginInterface.reduce((prev, fn) => ({ ...prev, [fn]: ext[fn] }), {})
    )
  },
  createClass(input) {
    const [name = 'default', options] = !input || typeof input === 'string'
      ? [input, {}]
      : [undefined, input]
    const Context = class extends this.Base { }

    const definition = this.definitions[name]
    assert(definition, `definition ${name} not found`)

    Context.definition = definition
    Context.configuration = configuration
    Context._$factory = this

    // invoke extend fn on every plugin with new class
    extensions.filter(e => e.extend).forEach(e => e.extend(Context, options))

    return Context
  }
}
