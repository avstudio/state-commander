import Vue from 'vue'
import { Context } from '../../src'
import VueContext, { VueContextInstall } from '../../src/lib/vue-context'
import Logger from '../../src/lib/logger'
import commands from './commands'

Context.use(Logger)
Context.use(VueContext)

Vue.use(VueContextInstall)

const ContextClass = Context.createClass()
const context = new ContextClass({
  commands,
})
