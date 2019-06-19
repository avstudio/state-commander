import Context from './context'
import { makeRegistrationKey, makeHelperName } from './utils'
import Module from './lib/module'
import DefaultDefinition from './lib/default-definition'
import Handler from './lib/handler'
import CommandDispatcher from './lib/command-dispatcher'
import State from './lib/state'
import Stats from './lib/stats'
import ModuleInheritance from './lib/module-inheritance'
import ModuleMapper from './lib/module-mapper'
import CommandHelpers from './lib/command-helpers'
import VueContext from './lib/vue-context'
import Logger from './lib/logger'

Context.use(DefaultDefinition)
Context.use(CommandDispatcher)
Context.use(Module)
Context.use(Handler)
Context.use(State)

export {
  ModuleInheritance,
  ModuleMapper,
  CommandHelpers,
  VueContext,
  makeHelperName,
  makeRegistrationKey,
  Context,
  Stats,
  Logger
}
