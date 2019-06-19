export default {
  name: 'ModuleMapper',
  description: 'Parse modules map input',
  initialize(context, options) {
    this.reset(context, options)
  },
  reset(context, options = {}) {
    Object.entries(options).forEach(([
      path, {
        state,
        commands = []
      } = {}]) => {
      const mdl = context.registerModule(path, { commands })

      // "override" if already exists
      if (state) {
        context.registerState(mdl.namespace, state, { override: true })
      }
    })
  }
}
