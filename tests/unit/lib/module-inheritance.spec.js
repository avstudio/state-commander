import Context from '../../../src/context'
import Module from '../../../src/lib/module'
import ModuleInheritance from '../../../src/lib/module-inheritance'
import DefaultDefinition from '../../../src/lib/default-definition'
import { makeClass } from '../../helpers'

Context.use(DefaultDefinition)
Context.use(Module)
Context.use(ModuleInheritance)

const ContextClass = Context.createClass()

describe('Module#addChild', () => {
  let context

  beforeEach(() => {
    context = new ContextClass()
  })

  it('should throw error if argument is instance of Module', () => {
    const mdl = Context.Module.create(context, 'ns/module', { name: 'custom' })
    expect(
      () => mdl.addChild(makeClass('Invalid').build())
    ).toThrow(/argument must be/)
  })

  it('should add child module with nested path', () => {
    const parent = Context.Module.create(context, 'parent/module')
    const child = Context.Module.create(context, 'child/module')

    parent.addChild(child)

    expect(
      context._modules['parent/module/child/module'].namespace
    ).toBe('parent/module/child/module')
  })

  it('replace module', () => {
    const parent = Context.Module.create(context, 'parent/module')
    const child = Context.Module.create(context, 'child/module')

    context.registerModule(parent)
    context.registerModule(child)

    parent.addChild(child)

    expect(context._modules['child/module']).toBeUndefined()
    expect(context._modules['parent/module']).toBeDefined()
    expect(context._modules['parent/module/child/module']).toBeDefined()
    expect(context._modules['child/module/parent/module']).toBeUndefined()
  })
})
