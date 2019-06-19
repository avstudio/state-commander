import Vue from 'vue'
import { Context } from '../../../src'
import VueContext, { VueContextInstall } from '../../../src/lib/vue-context'

Context.use(VueContext)
Vue.use(VueContextInstall)

const ContextClass = Context.createClass()

describe('VueContext', () => {
  const context = new ContextClass()

  it('should extend Vue', () => {
    const vm = new Vue({
      context,
      render: h => h('<div/>')
    })
    expect(vm.$context).toBeDefined()
    expect(vm.$context.dispatch).toBeDefined()
  })
})
