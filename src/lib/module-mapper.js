export default {
  name: 'ModuleMapper',
  description: 'Parse modules map input',
  initialize(context, options) {
    this.reset(context, options)
  },
  reset(context, options) {
    Object.entries(options).forEach(([
      path, {
        state,
        commands = []
      } = {}]) => {
      if (state) {
        const mdl = context.registerModule(path, { commands, state })

        // "override" if already exists
        context.unregisterState(mdl.namespace)
        context.registerState(mdl.namespace, state)
      }
    })
  }
}
