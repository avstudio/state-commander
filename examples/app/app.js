import Vue from 'vue'
import { Context, Stats } from '../../src'
import App from './App.vue'
import VueContext, { VueContextInstall } from '../../src/lib/vue-context'
import CommandHelpers from '../../src/lib/command-helpers'

import Logger from '../../src/lib/logger'
import * as commands from './commands'

Context.use(Stats)
Context.use(Logger)
Context.use(VueContext)
Context.use(CommandHelpers)

Vue.use(VueContextInstall)


const ContextClass = Context.createClass()
const context = new ContextClass({
  commands: Object.values(commands)
})

new Vue({
  provide: context.getHelpers(),
  el: '#app',
  context,
  render: h => h(App)
})
