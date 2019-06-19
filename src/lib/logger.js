const log = (e, data = 'No data') => {
  console.log(`%cCOMMAND%c${e}`,
    'background: #009688; color: white; padding: 2px 4px; border-radius: 3px 0 0 3px; font-weight: bold;',
    'background: #dadedf; color: rgba(0,0,0,0.87); padding: 2px 4px; border-radius: 0 3px 3px 0; font-weight: bold;', data)
}

const callCommandHook = ({ event, payload }, _, next) => {
  log(event, payload)
  next()
}

export default {
  name: 'Logger',
  description: 'Log command execution',
  install(ContextFactory) {
    const Context = ContextFactory
    Context.hooks['command:invoke'].attach(callCommandHook)
  }
}
