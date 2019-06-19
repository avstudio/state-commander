import { assert } from '../utils'

function addChild(child) {
  assert(
    (child && child.constructor.name === 'Module'),
    'argument must be string (path) or instance of Module'
  )

  this.context.unregisterModule(child)
  child._pathParser.prepend(this.path)
  this.context.registerModule(child)
  return this
}

export default {
  name: 'ModuleInheritance',
  install(ContextFactory) {
    const Context = ContextFactory
    Context.Module.Base.prototype.addChild = addChild
  }
}
