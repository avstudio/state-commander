// configuration object for the possibility to be overwritten
const configuration = {
  statsPrinter: stats => console.table(stats)
}

// This will be associated with context object instance
function printStats() {
  return configuration.statsPrinter(this._stats)
}

const commandInvokeHookHandler = ({ event }, contextInstance, next) => {
  // let flow continue and do counting after command is done
  next()

  const context = contextInstance
  context._stats[event] = context._stats[event] || 0
  context._stats[event] += 1
}

export default {
  name: 'CommandStats',

  description: 'Plugin description',

  // set configuration
  // This can be overwritten
  // Context.configuration.commandStats.statsPrinter = ()=>{}
  configuration,

  // install method for our plugin
  // ContextFactory is actual the main Context object
  install(ContextFactory) {
    const Context = ContextFactory

    // set our printer method on the context instance object
    Context.Base.prototype.printStats = printStats

    // attach hook handler to the command invoke hook
    Context.hooks['command:invoke'].attach(commandInvokeHookHandler)
  },
  // runs on the context object initialization
  initialize(context) {
    // actually set out map
    this.reset(context)
  },
  // reset method. It is not mandatory and it depends on the plugin logic and purpose
  reset(contextInstance) {
    const context = contextInstance
    context._stats = {}
  }
}
