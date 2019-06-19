function vueContextInit() {
  const options = this.$options
  if (options.context) {
    this.$context = typeof options.context === 'function'
      ? options.context()
      : options.context
  } else if (options.parent && options.parent.$context) {
    this.$context = options.parent.$context
  }
}

//  recursion to set a deep property on an object and hook it into the Vue reactivity system
function setState(state, key, value) {
  if (!state[key]) {
    this.set(state, key, {})
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    Object.entries(value).forEach(([k, item]) => {
      setState.call(this, state[key], k, item)
    })
  } else {
    // eslint-disable-next-line no-param-reassign
    state[key] = value
  }
}

const VuePlugin = {
  install(Vue) {
    Vue.mixin({
      beforeCreate: vueContextInit
    })
  }
}

export default {
  name: 'VueContext',
  description: 'Connect State Commander with Vue',
  install(_Context, { vue: Vue }) {
    const Context = _Context
    Context.configuration.state.buildState = (state = {}) => Vue.observable(state)
    Context.configuration.state.setState = (
      state, key, value
    ) => setState.call(Vue, state, key, value)
    // set context object in Vue
    Vue.use(VuePlugin)
  }
}
