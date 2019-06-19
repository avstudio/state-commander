import Vue from 'vue'
import { assert } from '../utils'

function vueContextInit() {
  const options = this.$options
  // context injection
  if (options.context) {
    this.$context = typeof options.context === 'function'
      ? options.context()
      : options.context
  } else if (options.parent && options.parent.$context) {
    this.$context = options.parent.$context
  }
}

export const VueContextInstall = {
  install(_Vue) {
    if (Vue && _Vue === Vue) {
      if (process.env.NODE_ENV !== 'production') {
        assert(
          false,
          '[VueContext] already installed. Vue.use(VueContext) should be called only once.'
        )
      }
      return
    }
    const Vue = _Vue
    Vue.mixin({
      beforeCreate: vueContextInit
    })
  }
}

export default {
  name: 'VueContext',
  description: 'Connect State Commander with Vue',
  install(ContextFactory) {
    const Context = ContextFactory
    Context.configuration.state.buildState = (state = {}) => Vue.observable(state)
  }
}
