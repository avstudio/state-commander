import PathParser from '../path-parser'
import { assert, makeRegistrationKey } from '../utils'

const configuration = {
  rootModuleName: 'root'
}

const hooks = {}

class Base {
  registerCommand(Command) {
    const command = Command

    assert(
      Command && [
        Command.prototype.execute,
        Command.prototype.commit,
        Command.prototype.getter && Command.state
      ].some(t => t),
      `invalid command class ${Command.name}.
    class must have declared at least:
    execute, commit or getter with state property`
    )

    const { definition, Handler } = this.context.constructor
    assert(definition, 'Missing context definition')
    assert(Handler, 'Handler extension is required')

    hooks['module:register'].execute(
      { command: Command },
      this,
      () => {
        command.registrationKey = makeRegistrationKey(
          { path: this.namespace, command: Command.name }
        )

        Object.entries(definition).forEach(([, item]) => {
          const fnName = item.invokeFn.name
            ? item.invokeFn.name
            : item.invokeFn

          if (typeof Command.prototype[fnName] === 'function') {
            const handler = Handler.create(this, Command, item)
            // set reference to command
            Object.defineProperty(handler, 'command', {
              get() { return command }
            })
            this.context[`_${item.map}`][handler.registrationKey] = handler
          }
        })
        this._commands.push(Command)
      }
    )
  }

  unregisterCommand(Command) {
    const { definition } = this.context.constructor

    assert(definition, 'Missing context definition')

    hooks['module:unregister'].execute(
      { command: Command },
      this,
      () => {
        Object.entries(definition).forEach(([, item]) => {
          delete this.context[`_${item.map}`][Command.registrationKey]
        })
        this._commands = this._commands.filter(
          c => c.registrationKey !== Command.registrationKey
        )
      }
    )
  }

  getCommands() {
    return this._commands
  }

  unregisterAllCommands() {
    return this._commands.forEach(c => this.unregisterCommand(c))
  }
}

function getModules() {
  return this._modules
}

function getModule(key) {
  return this._modules[key]
}

function registerModule(m, { commands = [] } = {}) {
  assert(
    typeof m === 'string' || (m && m.constructor.name === 'Module'),
    'argument must be string (path) or instance of Module'
  )

  const newModule = typeof m === 'string'
    ? this.constructor.Module.create(this, m, { commands })
    : m

  const key = newModule.registrationKey
  assert(key, 'registration key is missing')
  assert(!this._modules[key], 'module already exists')

  this._modules[key] = newModule
  return newModule
}

function unregisterModule(m) {
  assert(
    typeof m === 'string' || (m && m.constructor.name === 'Module'),
    'argument must be string (path) or instance of Module'
  )
  const mdl = m.registrationKey ? m : this.getModule(m)
  if (!mdl) { return }
  mdl.unregisterAllCommands()
  delete this._modules[mdl.registrationKey]
}

const ModuleFactory = {
  Base,
  create(context, path,
    {
      commands = [],
      name = configuration.rootModuleName
    } = {}) {
    const pathParser = new PathParser(path)
    const Module = class extends this.Base { }

    const _module = new Module()

    Object.defineProperty(_module, 'context', {
      get() { return context }
    })

    Object.defineProperty(_module, '_pathParser', {
      get() { return pathParser }
    })

    Object.defineProperty(_module, 'path', {
      get() { return _module._pathParser.path }
    })

    Object.defineProperty(_module, 'namespace', {
      get() { return _module._pathParser.namespace }
    })

    Object.defineProperty(_module, 'name', {
      get() { return name || _module._pathParser.moduleName }
    })

    Object.defineProperty(_module, 'registrationKey', {
      get() {
        return (
          _module._pathParser.namespace
          || _module._pathParser.moduleName
          || _module.name
        ).toLowerCase()
      }
    })

    _module._commands = []
    commands.forEach(c => _module.registerCommand(c))

    return _module
  }
}

export default {
  name: 'Module',
  hooks: ['module:register', 'module:unregister'],
  configuration,
  install(ContextFactory) {
    const Context = ContextFactory
    Context.Module = ModuleFactory

    // keep reference
    hooks['module:register'] = Context.hooks['module:register']
    hooks['module:unregister'] = Context.hooks['module:unregister']

    Context.Base.Module = Context.Module
    Context.Base.prototype.getModule = getModule
    Context.Base.prototype.getModules = getModules
    Context.Base.prototype.registerModule = registerModule
    Context.Base.prototype.unregisterModule = unregisterModule
  },
  initialize(contextInstance, { commands = [] } = {}) {
    const context = contextInstance
    context._modules = Object.create(null)

    context.registerModule(
      // add single root/non namespaced module
      context.constructor.Module.create(context, null, { commands })
    )
  }
}
